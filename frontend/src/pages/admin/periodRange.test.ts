// Çalıştır: node src/pages/admin/periodRange.test.ts   (Node 24 .ts'i doğrudan çalıştırır)
// Bilerek import'suz assert — tsconfig.app.json types:["vite/client"] olduğu için node:test/node:assert tiplenmiyor.
import { periodRange } from './periodRange.ts';

let fails = 0;
function eq(actual: unknown, expected: unknown, what: string) {
  if (actual === expected) return;
  fails++;
  console.error(`FAIL ${what}: beklenen ${String(expected)}, gelen ${String(actual)}`);
}

// 1) Pazar günü → hafta bir önceki Pazartesi'de başlar
const sunday = new Date(2026, 7, 2); // 2 Ağustos 2026
eq(sunday.getDay(), 0, 'ön koşul: 2026-08-02 Pazar');
const w = periodRange('hafta', 0, sunday);
eq(w.start, '2026-07-27', 'Pazar → hafta başlangıcı önceki Pazartesi');
eq(w.end, '2026-08-02', 'Pazar → hafta bitişi aynı Pazar');

// 2) Ocak'ta offset -1 → önceki yılın Aralık ayı
const jan = periodRange('ay', -1, new Date(2026, 0, 15));
eq(jan.start, '2025-12-01', 'Ocak -1 ay → önceki yıl Aralık başı');
eq(jan.end, '2025-12-31', 'Ocak -1 ay → önceki yıl Aralık sonu');

// 3) 31 günlük ay → 1'inden 31'ine
const jul = periodRange('ay', 0, new Date(2026, 6, 15));
eq(jul.start, '2026-07-01', 'Temmuz başı');
eq(jul.end, '2026-07-31', 'Temmuz sonu 31');

// 4) Şubat 2028 (artık yıl) → 29 gün
const feb = periodRange('ay', 0, new Date(2028, 1, 10));
eq(feb.start, '2028-02-01', 'Şubat 2028 başı');
eq(feb.end, '2028-02-29', 'Şubat 2028 sonu 29 (artık yıl)');

// 5) Gün modu ay sınırını aşabilmeli
const day = periodRange('gun', 1, new Date(2026, 6, 31));
eq(day.start, '2026-08-01', 'Gün +1 ay sınırını aşar');
eq(day.start, day.end, 'Gün modunda başlangıç = bitiş');

// 6) Hafta offset'i 7 gün kaydırır
const nextWeek = periodRange('hafta', 1, sunday);
eq(nextWeek.start, '2026-08-03', 'Hafta +1 → sonraki Pazartesi');

if (fails) throw new Error(`${fails} kontrol başarısız`);
console.log('periodRange: tüm kontroller geçti');
