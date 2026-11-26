import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BRAND_BG = '#0f0f13'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Installable app that works offline (service worker precaches the whole build)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.jpg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gran Rifa - Pacoreños en Medellín',
        short_name: 'Gran Rifa',
        description: 'Rifas digitales en vivo para Pacoreños en Medellín',
        lang: 'es',
        theme_color: BRAND_BG,
        background_color: BRAND_BG,
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,jpg,png,svg,webmanifest}'],
      },
    }),
  ],
  base: '/Rifas-Pacorenos/', // Base path for GitHub Pages (your repo name)
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    restoreMocks: true,
    include: ['src/**/*.test.{js,jsx}'],
  },
})
