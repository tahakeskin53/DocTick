// Çalıştır: node src/auth/identityGate.test.ts   (Node 24 .ts'i doğrudan çalıştırır)
// Bilerek import'suz assert — periodRange.test.ts / boot.test.ts ile aynı desen.
import { leavesIdentity } from './identityGate.ts';

let fails = 0;
function eq(actual: unknown, expected: unknown, what: string) {
  if (actual === expected) return;
  fails++;
  console.error(`FAIL ${what}: beklenen ${String(expected)}, gelen ${String(actual)}`);
}

// Gerçek akışı adım adım yürüt; hangi adımlarda önbellek atılıyor?
const walk = (ids: (number | null)[]) => {
  let last: number | null = null;
  const cleared: number[] = [];
  ids.forEach((id, i) => { if (leavesIdentity(last, id)) cleared.push(i); last = id; });
  return JSON.stringify(cleared);
};

// 1) Sayfa açılışı + ilk giriş: temizleme YOK. Temizleseydik index.html'deki boot isteğiyle
//    beslenen sorgu iptal olur, 0fc2c1a'daki perf kazancı geri giderdi.
eq(walk([null, 53]), '[]', 'ilk giriste temizlenmez');

// 2) Bildirilen hata: tahakeskin53 → çıkış → tahakeskin5306. Çıkış adımında atılmalı.
eq(walk([null, 53, null, 5306]), '[2]', 'cikista bir kez temizlenir');

// 3) Çıkışsız doğrudan hesap değişimi (oturum başka kullanıcıya döndü) de yakalanmalı.
eq(walk([null, 53, 5306]), '[2]', 'A->B gecisinde temizlenir');

// 4) Aynı kullanıcı tekrar doğrulanınca boşuna temizlenmemeli (her /me sonrası cache atmak
//    sonsuz yeniden istek demek olurdu).
eq(walk([null, 53, 53, 53]), '[]', 'ayni kullanicida temizlenmez');

if (fails) throw new Error(`${fails} test basarisiz`);
console.log('OK: identityGate kimlik gecisleri');
