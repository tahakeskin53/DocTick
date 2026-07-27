import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// npx @vite-pwa/assets-generator  →  public/ içine PWA ikon seti üretir.
// minimal-2023: pwa-64/192/512, maskable-512, apple-touch-180, favicon(16/32/ico)
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo-icon.svg'],
})
