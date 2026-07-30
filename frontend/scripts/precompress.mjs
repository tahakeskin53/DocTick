// dist/assets içindeki js/css'i build zamanında brotli kalite 11 ile sıkıştırır.
// Neden: Kestrel'in çalışma anındaki sıkıştırması hız öncelikli (kullanıcı beklerken yapılıyor),
// bu yüzden düşük kalite kullanır — 548 KB JS için ~224 KB. Burada acele yok, kalite 11 ~150 KB.
// Sunucu tarafı Program.cs'teki .br yönlendirmesiyle bu dosyaları servis eder; yoksa çalışma anı
// sıkıştırmasına düşer, yani bu script atlanırsa site bozulmaz, sadece yavaşlar.
// ponytail: yalnızca brotli. br desteklemeyen istemciye ResponseCompression çalışma anında gzip
// üretir — ayrıca .gz üretmek çıktıyı ikiye katlar, kazanç bu azınlık için kayda değmez.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

const dir = 'dist/assets';
let raw = 0;
let out = 0;

for (const name of readdirSync(dir)) {
  if (!/\.(js|css)$/.test(name)) continue;
  const path = join(dir, name);
  const buf = readFileSync(path);
  const br = brotliCompressSync(buf, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: buf.length, // sözlük penceresini doğru seçtirir
    },
  });
  writeFileSync(`${path}.br`, br);
  raw += buf.length;
  out += br.length;
  console.log(`  ${name}  ${buf.length} -> ${br.length}`);
}

if (raw === 0) throw new Error(`precompress: ${dir} içinde js/css bulunamadı — build çıktısı eksik mi?`);
console.log(`precompress: ${raw} -> ${out} bayt (brotli q11)`);
