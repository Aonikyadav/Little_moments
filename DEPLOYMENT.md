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
