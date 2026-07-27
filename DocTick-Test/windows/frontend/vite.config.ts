import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Geliştirmede /api → backend (localhost:5080). Aynı köken gibi çalışır, cookie sorunsuz.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // yeni build → SW otomatik günceller; kurulu tüm PWA'lar güncel versiyonu alır
      includeAssets: ['favicon.svg', 'logo.svg', 'logo-icon.svg', 'apple-touch-icon-180x180.png', 'favicon.ico'],
      manifest: {
        name: 'DocTick',
        short_name: 'DocTick',
        description: 'Hastane online randevu sistemi',
        lang: 'tr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        id: '/',
        display: 'standalone',
        theme_color: '#164478',       // --blue-700 (--surface-brand)
        background_color: '#F7F9FB',  // --paper (--surface-page)
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // PWABuilder kuralı: maskable AYRI girdi, 'any maskable' çifti yasak.
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Randevu Al', url: '/randevu-al', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Randevularım', url: '/randevularim', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // SPA navigasyonları offline'da index.html'e düşer; /api asla HTML'e düşmesin.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Yalnız Randevularım listesi (GET): önce ağ, ağ yoksa son önbellek.
            // Workbox route'ları varsayılan olarak yalnız GET ile eşleşir — POST /api/appointments önbelleklenmez.
            urlPattern: ({ url }) => url.pathname === '/api/appointments',
            handler: 'NetworkFirst',
            options: { cacheName: 'appointments', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true, // 5173 doluysa 5174'e kayma — hata ver. Google OAuth origin'i sadece 5173.
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  // SW üretim davranışı `npm run preview` ile test edilir; 5173 = OAuth origin'i, proxy = cookie akışı.
  preview: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
})
