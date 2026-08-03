// scripts/check_scroll_video.mjs — hero videonun scroll ile SURULDUGUNU dogrular.
// Regresyon: 'loadedmetadata' tek atisliktir ve React handler'i baglanmadan once
// atesleneb1lir (soguk cache / gizli sekme). ScrollVideo bir zamanlar sureyi o
// olaydan bir kez latch'liyordu; olay kacinca video ilk karede kalici olarak
// doniyordu. Bu kontrol tam da o senaryoyu (sifir cache, taze profil) surer.
//
// Kullanim:
//   cd frontend && npm run dev          # ya da: npm run build && npm run preview
//   node scripts/check_scroll_video.mjs                 # varsayilan http://localhost:5173/
//   TARGET=https://doctick.me/ node scripts/check_scroll_video.mjs
//   MOBILE=1 node scripts/check_scroll_video.mjs        # 9x16 / dokunmatik yolu
//
// playwright-core kurulu degilse ATLAR (projeye zorunlu bagimlilik eklemez):
//   npm i -D playwright-core

const TARGET = process.env.TARGET ?? 'http://localhost:5173/';
const MOBILE = process.env.MOBILE === '1';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// ESM yukari dogru yururken repo kokunde node_modules yok; frontend/'dekine bak.
let chromium;
try {
  const { createRequire } = await import('node:module');
  ({ chromium } = createRequire(new URL('../frontend/package.json', import.meta.url))('playwright-core'));
} catch { console.log('ATLANDI: playwright-core yok (cd frontend && npm i -D playwright-core)'); process.exit(0); }

const { existsSync } = await import('node:fs');
if (!existsSync(CHROME)) { console.log(`ATLANDI: Chrome bulunamadi (${CHROME}); CHROME_PATH ile ver.`); process.exit(0); }

let fails = 0;
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); fails++; } };

// headless + taze context = gizli sekme esdegeri: sifir cache, sifir cerez.
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: MOBILE ? { width: 412, height: 915 } : { width: 1440, height: 900 },
  isMobile: MOBILE, hasTouch: MOBILE, deviceScaleFactor: MOBILE ? 3 : 1,
  userAgent: MOBILE
    ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
    : undefined,
});
const page = await ctx.newPage();

const snap = () => page.evaluate(() => {
  const v = document.querySelector('video.dt-sv__video');
  return {
    found: !!v,
    dur: v?.duration ?? null,
    ct: v ? +v.currentTime.toFixed(3) : null,
    errBox: document.querySelector('.dt-sv__error')?.textContent ?? null,
    scrollY: Math.round(scrollY),
    maxScroll: Math.round(document.documentElement.scrollHeight - innerHeight),
  };
});

try {
  await page.goto(TARGET, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(6000); // ScrollVideo.LOAD_TIMEOUT ile ayni

  const before = await snap();
  assert(before.found, 'hero <video> DOM icinde olmali');
  assert(!before.errBox, `video hata kutusu gorunmemeli (${before.errBox})`);
  assert(before.dur > 0, `metadata gelmis olmali (duration=${before.dur})`);
  assert(before.maxScroll > 0, 'landing sayfasi kaydirilabilir olmali');

  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(180); }
  await page.waitForTimeout(1500);
  const after = await snap();

  // ASIL KONTROL: scroll playhead'i surmeli. Latch hatasinda ct 0'da cakili kalir.
  assert(after.scrollY > before.scrollY, `sayfa kaymis olmali (${before.scrollY} -> ${after.scrollY})`);
  assert(Math.abs((after.ct ?? 0) - (before.ct ?? 0)) > 0.2,
    `scroll videoyu surmeli ama currentTime sabit kaldi (${before.ct} -> ${after.ct}, scrollY ${before.scrollY} -> ${after.scrollY})`);
} finally {
  await browser.close();
}

if (fails) { console.error(`${fails} kontrol basarisiz`); process.exit(1); }
console.log(`ScrollVideo kontrolu OK (${MOBILE ? 'mobil 9x16' : 'masaustu 16x9'}, ${TARGET})`);
