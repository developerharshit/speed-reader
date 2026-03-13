import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',   // silently update SW when a new build is deployed
      manifestFilename: 'manifest.webmanifest',  // explicit filename for manifest
      includeAssets: [
        'favicon.svg',
        'logo.svg',
        'apple-touch-icon-180x180.png',
      ],
      manifest: {
        name: 'Speed Reader',
        short_name: 'SpeedRead',
        description: 'RSVP Speed Reading – read PDF & EPUB books at lightning speed',
        theme_color: '#7c3aed',
        background_color: '#faf7f0',
        display: 'standalone',
        orientation: 'portrait-primary',
        // Relative start_url/scope works for both / (local) and /speed-reader/ (GitHub Pages)
        scope: './',
        start_url: './',
        icons: [
          { src: 'pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',           sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache all app shell assets including the PDF.js worker (.mjs)
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg}'],
        // Exclude large test files from the precache
        globIgnores: ['**/test-book.*'],
        // SPA fallback so the app works offline even if the user navigated away
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  // VITE_BASE is injected by the GitHub Actions workflow as /repo-name/
  // Locally it falls back to '/' so the dev server works normally
  base: process.env.VITE_BASE || '/',
})
