# Guide: How to Run the Secure Media Link Gateway

This project consists of a **React Frontend** (Vite) and a **Node.js Backend** (Express). Follow these steps to set up and run both services.

---

## 🏗 Prerequisites
- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (Standard with Node.js)
- A [Supabase](https://supabase.com/) project (for authentication and media storage)

---

## 💻 1. Frontend Setup (React + Vite)
The frontend is located in the root directory.

1. **Navigate to the project root**:
   ```bash
   cd "Secure Media Link"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The frontend should now be running at `http://localhost:5173` (or the port shown in your terminal).*

---

## 🛠 2. Backend Setup (Node.js + Express)
The backend is located in the `/backend` folder.

1. **Navigate to the backend directory**:
   ```bash
   cd "Secure Media Link/backend"
   ```

2. **Install dependencies**:
   ```bash
   npm install express jsonwebtoken @supabase/supabase-js express-rate-limit cookie-parser dotenv
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `/backend` folder and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://lmcbzppohkxlqgwagfhn.supabase.co
   SUPABASE_KEY=sb_publishable_xUE90TpKcxA-uTjR8dNLVw__R9pf-T0
   JWT_SECRET=a_random_secure_string_for_tokens
   PORT=5000
   ```

4. **Start the server**:
   ```bash
   node server.js
   ```
   *The backend should now be listening at `http://localhost:5000`.*

---

## 🔐 3. Supabase Configuration
To make the system fully functional, you need the following in your Supabase project:

- **Storage Bucket**: Create a private bucket named `media`.
- **Database Table**: Create a `links` table:
  - `id`: UUID (Primary Key)
  - `file_path`: Text (Path to the file in Supabase Storage)
  - `password`: Text (Hashed password)
  - `expiry`: Timestamp (Expiration time)
  - `max_views`: Integer (Max view count)
  - `views`: Integer (Default 0, current view count)
  - `media_type`: Text (e.g., 'image', 'video', 'pdf')

---

## 🚀 4. Testing the System
1. Open the frontend in your browser.
2. Go to the **Upload** tab and upload a test file with a password.
3. Once the link is generated, try to access it via the **Preview** tab or the generated URL.
4. Monitor active link statistics in the **Admin** tab.

**Important**: Ensure the frontend `API_URL` (if configured) points to your backend (`http://localhost:5000`).
