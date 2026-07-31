// Çalıştır: node src/api/deleteDoctor.test.ts   (Node 24 .ts'i doğrudan çalıştırır)
// Bilerek import'suz assert — boot.test.ts / periodRange.test.ts ile aynı desen.
//
// Neyi koruyor: doktor silme iki yönlü sözleşmeye bağlı.
//  1) Başarıda gövdedeki {cancelled, notified} çağrıcıya ULAŞMALI — Doctors.tsx bu sayılarla
//     "N randevu iptal edildi, M hastaya e-posta gönderildi" toast'ını basıyor.
//  2) Hatada backend mesajı ÇAĞIRICIYA ULAŞMALI — yoksa silme sessizce ölür ve
//     kullanıcı "çalışmıyor" der (asıl bug buydu).
import { Api, ApiError } from './client.ts';

let fails = 0;
function eq(actual: unknown, expected: unknown, what: string) {
  if (actual === expected) return;
  fails++;
  console.error(`FAIL ${what}: beklenen ${String(expected)}, gelen ${String(actual)}`);
}

const g = globalThis as unknown as { window?: unknown; fetch: typeof fetch };
g.window = g; // client.ts window üzerinden okuyor; Node'da kendimizi window yap

// 1) 200 + gövde → iptal/bildirim sayıları çözümlenir
g.fetch = (async () => new Response(JSON.stringify({ cancelled: 3, notified: 2 }), {
  status: 200, headers: { 'content-type': 'application/json' },
})) as typeof fetch;

const ok = await Api.deleteDoctor(7);
eq(ok.cancelled, 3, 'iptal edilen randevu sayisi cozumlenir');
eq(ok.notified, 2, 'bildirim gonderilen hasta sayisi cozumlenir');

// 2) Hata → ApiError, status ve backend gerekçesi korunur (toast bunu gösterecek)
g.fetch = (async () => new Response('Doktor bulunamadi.', { status: 404 })) as typeof fetch;

let err: unknown;
try { await Api.deleteDoctor(999); } catch (e) { err = e; }
eq(err instanceof ApiError, true, 'hata ApiError firlatir');
eq((err as ApiError).status, 404, 'status korunur');
eq(String((err as ApiError).message).includes('bulunamadi'), true, 'backend gerekcesi korunur');

// throw ile bitir: `process` tsconfig.app.json'da tiplenmiyor (types: ["vite/client"]),
// kullanılırsa `tsc -b` ve dolayısıyla `npm run build` kırılır.
if (fails) throw new Error(`${fails} test basarisiz`);
console.log('OK: doktor silme sonucu ve hatasi cagiriciya ulasiyor');
