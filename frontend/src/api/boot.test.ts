// Çalıştır: node src/api/boot.test.ts   (Node 24 .ts'i doğrudan çalıştırır)
// Bilerek import'suz assert — periodRange.test.ts ile aynı desen.
import { takeBoot } from './client.ts';

let fails = 0;
function eq(actual: unknown, expected: unknown, what: string) {
  if (actual === expected) return;
  fails++;
  console.error(`FAIL ${what}: beklenen ${String(expected)}, gelen ${String(actual)}`);
}

const g = globalThis as unknown as { window?: unknown; __boot?: unknown };
g.window = g; // client.ts window üzerinden okuyor; Node'da kendimizi window yap

// 1) __boot yoksa undefined döner (dev/SSR/eski önbellek senaryosu — çökmemeli)
eq(takeBoot('me'), undefined, '__boot yokken undefined');

// 2) İlk çağrı promise'i verir, İKİNCİ çağrı vermez.
//    Response gövdesi bir kez okunabilir; iki tüketici olursa "body already read" hatası çıkar.
const fake = Promise.resolve('yerine-gecen' as unknown as Response);
g.__boot = { me: fake, appts: undefined };
eq(takeBoot('me'), fake, 'ilk cagri promise doner');
eq(takeBoot('me'), undefined, 'ikinci cagri undefined doner');

// 3) Anahtarlar birbirinden bagimsiz
const a = Promise.resolve('appts' as unknown as Response);
g.__boot = { me: fake, appts: a };
eq(takeBoot('appts'), a, 'appts kendi promise ini doner');
eq(takeBoot('me'), fake, 'me hala tuketilebilir');

// throw ile bitir: `process` tsconfig.app.json'da tiplenmiyor (types: ["vite/client"]),
// kullanılırsa `tsc -b` ve dolayısıyla `npm run build` kırılır.
if (fails) throw new Error(`${fails} test basarisiz`);
console.log('OK: takeBoot tek seferlik');
