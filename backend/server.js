import express from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import * as dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. Rate Limiting (Brute Force Protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts, please try again later.'
});

// Configure Multer for memory buffering
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

// 1.5. File Upload endpoint to Supabase Storage
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileName = `uploads/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;
    
    res.json({ success: true, file_path: data.path, media_type: req.file.mimetype, media_name: req.file.originalname });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload to storage' });
  }
});

// 2. Create Link endpoint
app.post('/api/links', async (req, res) => {
  const { file_path, password, expiry_time, max_views, media_name, media_type } = req.body;
  
  if (!file_path || !password || !expiry_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('links')
    .insert([{ file_path, password, expiry_time, max_views, media_name, media_type }])
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    return res.status(500).json({ error: 'Failed to create link' });
  }

  res.json({ success: true, link: data });
});

// 3. Admin endpoint
app.get('/api/admin/links', async (req, res) => {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch' });
  res.json(data);
});

app.delete('/api/admin/links/:id', async (req, res) => {
  const { error } = await supabase.from('links').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to delete link' });
  res.json({ success: true });
});

// 4. Token Generation (Short TTL)
app.post('/api/verify', loginLimiter, async (req, res) => {
  const { linkId, password } = req.body;
  
  // Verify link and password in DB
  const { data: link } = await supabase.from('links').select('*').eq('id', linkId).single();
  
  if (!link || link.password !== password || new Date() > new Date(link.expiry)) {
    return res.status(401).json({ error: 'Invalid or expired link' });
  }

  // Generate 60s access token
  const token = jwt.sign({ linkId, ip: req.ip }, process.env.JWT_SECRET, { expiresIn: '60s' });
  
  res.cookie('secure_token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
  
  if (link.media_type === 'url') {
    res.json({ success: true, isUrl: true, url: link.file_path });
  } else {
    res.json({ success: true, isUrl: false, media_type: link.media_type });
  }
});

// 3. Media Proxy (Hides real URL)
app.get('/api/media/:linkId', async (req, res) => {
  const token = req.cookies.secure_token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.linkId !== req.params.linkId) throw new Error();

    // Fetch link metadata
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('id', req.params.linkId).single();

    if (linkError || !link) throw new Error();

    // Update View Count
    await supabase.rpc('increment_views', { link_id: req.params.linkId });

    if (link.media_type === 'url') {
      res.json({ isExternal: true, url: link.file_path });
      return;
    }

    // Fetch from Supabase Storage for files
    const { data, error } = await supabase.storage.from('media').download(link.file_path);
    if (error) throw new Error();
    
    // Set Security Headers
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Stream data back
    const buffer = await data.arrayBuffer();
    // Use the stored media_type, default to octet-stream
    res.setHeader('Content-Type', link.media_type || 'application/octet-stream');
    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(403).send('Forbidden');
  }
});

// 4. Secure Gateway Proxy (Bypasses Frame-Blocking headers)
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing URL');

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get('content-type');
    let body = await response.text();

    // If it's HTML, inject a <base> tag so relative links work
    if (contentType && contentType.includes('text/html')) {
      const baseTag = `<base href="${targetUrl}">`;
      body = body.replace('<head>', `<head>${baseTag}`);
    }

    res.setHeader('Content-Type', contentType || 'text/html');
    res.send(body);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).send('Failed to proxy resource');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
