import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  // Custom preset that generates a comprehensive icon set for:
  //   - iOS/iPadOS  (all apple-touch-icon sizes)
  //   - Android/PWA (pwa-*.png sizes for the manifest)
  //   - Windows     (tile sizes via browserconfig.xml)
  //   - Browser     (favicon.ico)
  preset: {
    transparent: {
      // PWA / Android manifest icons + Windows tile sizes
      sizes: [48, 64, 72, 96, 128, 144, 152, 192, 384, 512],
      favicons: [[64, 'favicon.ico']],
      padding: 0,
    },
    maskable: {
      // Android adaptive icon (full-bleed safe zone)
      sizes: [512],
      padding: 0.1,
    },
    apple: {
      // All iOS / iPadOS home-screen icon sizes
      //   57  → iPhone non-Retina (iOS ≤6)
      //   60  → iPhone non-Retina (iOS 7+)
      //   72  → iPad non-Retina (iOS ≤6)
      //   76  → iPad non-Retina (iOS 7+)
      //   114 → iPhone Retina (iOS ≤6)
      //   120 → iPhone Retina (iOS 7+)
      //   144 → iPad Retina (iOS ≤6)
      //   152 → iPad Retina (iOS 7+)
      //   167 → iPad Pro 12.9" (iOS 9+)
      //   180 → iPhone 6 Plus / SE / Xs Max (iOS 8+)
      sizes: [57, 60, 72, 76, 114, 120, 144, 152, 167, 180],
      padding: 0.05,
    },
  },
  images: ['public/logo.svg'],
})

