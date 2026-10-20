# Deployment Guide — Little Moments (Vercel & Render)

**Little Moments** is fully configured for zero-configuration, production-grade deployments on both **Vercel** and **Render** with high-performance static caching, SPA routing fallbacks, and case-sensitive Linux filesystem compatibility.

---

## 🚀 Option 1: Deploying to Vercel

### Method A: Connect Git Repository (Recommended)
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Vercel will automatically detect **Vite** and read [vercel.json](file:///c:/Users/AONAK%20YADAV/Downloads/Littel%20moments/vercel.json):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Your site will be live on a global Edge CDN in seconds!

### Method B: Deploy via Vercel CLI
Run the following in your terminal:
```bash
npm install -g vercel
vercel
```
To deploy straight to production:
```bash
vercel --prod
```

### Vercel Features Configured
- **SPA Routing**: Directly supports `/studio`, `/kbooth`, `/templates`, `/creations`, `/album` without 404 errors.
- **Case Sensitivity**: Rewrites `/Images/*` seamlessly to `/images/*`.
- **Immutable Asset Caching**: 1-year cache headers (`max-age=31536000, immutable`) for `/assets/`, `/stickers/`, `/images/`, and `/covers/`.
- **Security Headers**: Automatic `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Deployment Filter**: [.vercelignore](file:///c:/Users/AONAK%20YADAV/Downloads/Littel%20moments/.vercelignore) excludes bulky local archives and test files.

---

## 🌐 Option 2: Deploying to Render

### Method A: Blueprint Deployment (One-Click)
The repository includes a ready-to-use [render.yaml](file:///c:/Users/AONAK%20YADAV/Downloads/Littel%20moments/render.yaml) blueprint:
1. Push your repository to GitHub or GitLab.
2. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Blueprint**.
3. Connect your repository. Render will detect `render.yaml` and configure:
   - **Service Name**: `little-moments`
   - **Type**: Static Site
   - **Build Command**: `npm run build`
   - **Publish Directory**: `./dist`
   - **Node.js**: 22
4. Click **Apply**.

### Method B: Manual Static Site Creation
If not using Blueprints:
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect your repository.
3. Configure the settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Under **Redirects/Rewrites**, add:
   - Rule 1: `Rewrite` from `/Images/*` to `/images/*`
   - Rule 2: `Rewrite` from `/*` to `/index.html`
5. Click **Create Static Site**.

---

## 🛠 Local Build & Preview Verification

To test the production build locally before deploying:

```bash
# 1. Typecheck the codebase
npm run typecheck

# 2. Run automated test suites (22/22 tests)
npm test

# 3. Create the optimized production bundle
npm run build

# 4. Preview the production dist folder locally
npm run preview
```

The preview server will start at `http://localhost:3000` mirroring the exact production behavior.

---

## ⚡ Supabase Setup (PostgreSQL Database & Cloud Storage) — Recommended

Supabase only requires **2 keys** (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) with zero Google Cloud console wizards:

1. **Create a Supabase Project**:
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
   - Name it `little-moments`, set a database password, and click **Create new project**.

2. **Get Your 2 Keys**:
   - Go to **Project Settings** (gear icon) ➔ **API**.
   - Copy **Project URL** (`https://xyz.supabase.co`).
   - Copy **Project API Key (anon public)** (`eyJ...`).

3. **Create the Public Storage Bucket**:
   - In the left sidebar, click **Storage**.
   - Click **New bucket**, name it `photos`, and toggle **Public bucket** ON ➔ click **Save**.

4. **Run the 1-Click SQL Table Creation**:
   - In the left sidebar, click **SQL Editor** ➔ **New query**.
   - Paste the following and click **Run**:

```sql
create table if not exists photos (
  id text primary key,
  user_id text,
  image_url text not null,
  title text,
  template_id text,
  created_at timestamp with time zone default now()
);

alter table photos enable row level security;
create policy "Public photos can be read by anyone" on photos for select using (true);
create policy "Anyone can insert photos" on photos for insert with check (true);
```

5. **Connect It to Little Moments**:
   - Open Little Moments in your browser, click **Cloud DB** in the top navigation bar, paste your Project URL and Anon Key, and click **Save & Connect Supabase**!
   - On **Render**: In your Render Dashboard ➔ Environment, add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

---

## 🔥 Alternative: Firebase Cloud Database Setup

If you prefer Firebase instead, configure:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
