# Supabase Setup Guide: Secure Media Gateway

Follow these steps to configure your Supabase project for the Secure Media Gateway.

---

## 🏗 1. Create the Database Table
Go to the **SQL Editor** in your Supabase dashboard and run the following script to create the `links` table.

```sql
-- Create the links table
CREATE TABLE public.links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  file_path text NOT NULL,             -- Path to file in storage (e.g. 'private/image1.png')
  password text NOT NULL,              -- Hashed password for the link
  expiry_time timestamp with time zone NOT NULL, -- When the link expires
  max_views int DEFAULT 1,             -- Maximum allowed views
  views int DEFAULT 0,                 -- Current view count
  media_name text,                      -- Original file name
  media_type text                      -- MIME type (image/png, video/mp4, etc.)
);

-- (Optional) Enable Row Level Security
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- (Optional) Create a policy for the backend to read/write 
-- If using the Service Role Key from the backend, RLS is bypassed.
```

---

## 📦 2. Set Up Storage
Create a dedicated storage bucket to hold the uploaded media.

1. Go to **Storage** in the Supabase Dashboard.
2. Click **New Bucket**.
3. Name the bucket `media`.
4. **Important**: Set the bucket to **Private** (do not make it public).
5. (Optional) Create a folder inside named `uploads`.

---

## 🔑 3. Get Your API Keys
You will need these for your backend `.env` file.

1. Go to **Project Settings** > **API**.
2. Copy the **Project URL** (This is your `SUPABASE_URL`).
3. Under **Project API Keys**, copy the **service_role** key (This is your `SUPABASE_KEY`).
   - *Note: Use the service_role key for the backend to bypass RLS and manage private files securely.*

---

## ⚙ 4. Example Backend `.env`
Your `backend/.env` should look like this:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

---

## 🛠 5. Troubleshooting
- **Bucket Not Found**: Ensure the name is exactly `media` in both your bucket settings and your backend code.
- **Permission Denied**: If you are getting storage errors, double-check that you are using the `service_role` key and not the `anon` key in the backend.
- **SQL Errors**: Ensure you run the SQL script in the `public` schema.
