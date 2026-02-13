import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'LOGORN.png'],
      injectRegister: 'auto', // Diubah ke auto agar service worker otomatis jalan

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: 'SIGAP Gizi',       // <-- Nama Aplikasi sudah benar
        short_name: 'SIGAP Gizi', // <-- Nama di Home Screen
        description: 'Sistem Informasi Gizi Anak dan Ibu Terpadu',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: true, // Ubah ke true jika ingin ngetes PWA mode dev (localhost)
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    })
  ],

  // --- PERBAIKAN: Server block harus DI LUAR plugins ---
  server: {
    proxy: {
      '/api-wilayah': {
        target: 'https://wilayah.id/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-wilayah/, '')
      }
    }
  }
})