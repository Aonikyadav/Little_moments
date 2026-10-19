import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'

function localImagesPlugin() {
  const serveImage = (req: any, res: any, next: any) => {
    if (!req.url || !/^\/[iI]mages\//.test(req.url)) {
      return next()
    }
    try {
      const cleanUrl = req.url.split('?')[0]
      const decoded = decodeURIComponent(cleanUrl)
      
      const candidatePaths = [
        path.join(process.cwd(), 'public', decoded),
        path.join(process.cwd(), decoded.replace(/^\/[iI]mages\//, 'Images/')),
        path.join(process.cwd(), decoded.replace(/^\/[iI]mages\//, 'public/images/')),
      ]

      for (const filePath of candidatePaths) {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const isPng = filePath.toLowerCase().endsWith('.png')
          res.setHeader('Content-Type', isPng ? 'image/png' : 'image/jpeg')
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          fs.createReadStream(filePath).pipe(res)
          return
        }
      }
    } catch {
      // fallback to next
    }
    next()
  }

  return {
    name: 'serve-local-images',
    configureServer(server: any) {
      server.middlewares.use(serveImage)
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(serveImage)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localImagesPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname || '.', './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
})
