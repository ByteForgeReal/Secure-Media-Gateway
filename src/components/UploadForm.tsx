import React, { useState } from 'react';
import { Shield, Upload, Eye, CheckCircle2, Copy, RefreshCw, Link as LinkIcon, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export const UploadForm = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState(60); // minutes
  const [maxViews, setMaxViews] = useState(5);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ url: string } | null>(null);

  const handleUpload = async () => {
    if ((mode === 'file' && !file) || (mode === 'link' && !url) || !password) {
      alert('Please provide all required fields (Media, Password).');
      return;
    }
    
    setIsUploading(true);
    let filePath = '';
    let mediaType = '';
    let mediaName = '';

    try {
      if (mode === 'file' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        filePath = fileName;
        mediaType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'pdf';
        mediaName = file.name;
      } else if (mode === 'link' && url) {
        filePath = url;
        mediaType = 'url';
        mediaName = url;
      }

      // Attach Uploader Identity
      const { data: { session } } = await supabase.auth.getSession();
      const uploaderEmail = session?.user?.email || 'Unknown User';
      const finalMediaName = `${mediaName} [by ${uploaderEmail}]`;

      const expiryTime = new Date(Date.now() + expiry * 60000).toISOString();
      const { data: linkData, error: linkError } = await supabase
        .from('links')
        .insert([{
          file_path: filePath,
          password,
          expiry_time: expiryTime,
          max_views: maxViews,
          media_type: mediaType,
          media_name: finalMediaName,
          views: 0
        }])
        .select()
        .single();

      if (linkError) throw linkError;
      
      const encodedSecret = btoa(password);
      const baseUrl = window.location.origin + window.location.pathname;
      setResult({ url: `${baseUrl}?view=${linkData.id}&key=${encodedSecret}` });
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate secure link: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto p-1 bg-gradient-to-br from-emerald-500/20 to-slate-800/20 rounded-[2.6rem] shadow-2xl backdrop-blur-3xl"
    >
      <div className="bg-slate-900/90 rounded-[2.5rem] p-8 md:p-10 border border-white/5 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-[60px] rounded-full -mr-16 -mt-16" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{t('secureUpload')}</h2>
              <p className="text-slate-500 text-sm font-medium">{t('readyToShare')}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="upload-fields"
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 relative z-10"
            >
              {/* Tab Switcher */}
              <div className="flex p-1 bg-slate-950/50 rounded-2xl border border-white/5">
                <button
                  onClick={() => setMode('file')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${mode === 'file' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  <FileImage size={16} /> File Upload
                </button>
                <button
                  onClick={() => setMode('link')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${mode === 'link' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  <LinkIcon size={16} /> Paste Link
                </button>
              </div>

              {/* Dynamic Input based on Mode */}
              {mode === 'file' ? (
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer group relative overflow-hidden
                    ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-800/20 hover:border-emerald-500/40 hover:bg-emerald-500/5'}`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input type="file" id="file-upload" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center transition-all
                    ${file ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 group-hover:bg-emerald-500/20 group-hover:text-emerald-400'}`}>
                    <Upload size={30} />
                  </div>
                  <p className="text-white font-bold text-lg mb-1">{file ? file.name : t('dragToUpload')}</p>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('upTo')} 50MB</p>
                </motion.div>
              ) : (
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">External Link</label>
                  <input 
                    type="url" 
                    placeholder="https://youtube.com/watch?v=..."
                    className="input-field"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('password')}*</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('maxViews')}</label>
                  <div className="relative">
                    <Eye className="absolute left-5 top-4 text-slate-500" size={18} />
                    <input 
                      type="number" 
                      className="input-field pl-12"
                      value={maxViews}
                      onChange={(e) => setMaxViews(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('expiry')}</label>
                  <span className="text-emerald-400 font-bold text-sm">
                    {expiry >= 60 ? `${Math.floor(expiry/60)}h ${expiry%60}m` : `${expiry}m`}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="1440" 
                  step="5"
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  value={expiry}
                  onChange={(e) => setExpiry(Number(e.target.value))}
                />
              </div>

              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="btn-primary w-full py-4 relative group overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-400/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                {isUploading ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    <span>{t('encrypting')}</span>
                  </>
                ) : (
                  <span>{t('generateLink')}</span>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="text-center py-6 space-y-8 relative z-10"
            >
              <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-2 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 animate-float">
                <CheckCircle2 size={50} strokeWidth={1.5} />
              </div>
              
              <div>
                <h3 className="text-3xl font-black text-white mb-2">{t('linkGenerated')}</h3>
                <p className="text-slate-400 text-sm font-medium">{t('readyToShare')}</p>
              </div>
              
              <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-2 flex items-center gap-2 group">
                <div className="flex-1 px-4 py-2 text-emerald-400 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  {result.url}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(result.url)}
                  className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-emerald-900/40 active:scale-95"
                >
                  <Copy size={16} />
                  {t('copy')}
                </button>
              </div>

              <button 
                onClick={() => {setResult(null); setFile(null); setUrl('');}}
                className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2 mx-auto mt-4"
              >
                <RefreshCw size={14} />
                {t('uploadAnother')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
