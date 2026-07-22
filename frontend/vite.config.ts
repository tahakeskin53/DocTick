import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Geliştirmede /api → backend (localhost:5080). Aynı köken gibi çalışır, cookie sorunsuz.
export default defineConfig({
  plugins: [react()],
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
})
