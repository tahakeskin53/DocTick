// scripts/check_pwa.mjs — build sonrası dist/ PWA çıktısını doğrular.
// Kullanım: node scripts/check_pwa.mjs   (önce: cd frontend && npm run build)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
let fails = 0;
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); fails++; } };

assert(existsSync(dist + 'sw.js'), 'dist/sw.js uretilmis olmali');
assert(existsSync(dist + 'manifest.webmanifest'), 'dist/manifest.webmanifest uretilmis olmali');

if (existsSync(dist + 'manifest.webmanifest')) {
  const m = JSON.parse(readFileSync(dist + 'manifest.webmanifest', 'utf8'));
  // PWABuilder dogrulama kurallari (docs.pwabuilder.com):
  assert((m.name ?? '').length >= 2, 'name en az 2 karakter');
  assert((m.short_name ?? '').length >= 3, 'short_name en az 3 karakter (paketleme sarti)');
  assert(m.display === 'standalone', "display 'standalone'");
  assert(m.start_url === '/', "start_url '/'");
  assert((m.icons ?? []).some(i => i.sizes === '512x512' && (!i.purpose || i.purpose === 'any')), '512x512 purpose:any ikon var');
  assert((m.icons ?? []).some(i => i.purpose === 'maskable'), 'maskable ikon AYRI girdi olarak var');
  for (const i of m.icons ?? []) assert(existsSync(dist + i.src), `ikon dosyasi dist icinde: ${i.src}`);
  const html = readFileSync(dist + 'index.html', 'utf8');
  assert(html.includes('manifest.webmanifest'), 'index.html manifest linki iceriyor');
}

if (fails) { console.error(`${fails} kontrol basarisiz`); process.exit(1); }
console.log('PWA kontrolu OK');
