import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  // minimal-2023 generates:
  //   public/pwa-64x64.png
  //   public/pwa-192x192.png
  //   public/pwa-512x512.png
  //   public/maskable-icon-512x512.png  (Android adaptive icon)
  //   public/apple-touch-icon-180x180.png (iOS home-screen icon)
  preset: 'minimal-2023',
  images: ['public/logo.svg'],
})
