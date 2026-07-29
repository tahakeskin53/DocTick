// Admin "Randevular" sayfasının dönem hesabı. Tek saf fonksiyon — takvim mantığı
// (Pazartesi başlangıcı, ay sonu, yıl sınırı) burada, testi periodRange.test.ts'te.

export type Mode = 'gun' | 'hafta' | 'ay';

// Yerel ISO — toISOString() UTC'ye kaydırır, kullanma (Booking.tsx:50 ile aynı kalıp).
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// "2026-07-29" → "29 Tem 2026". ISO'yu new Date(str) ile parse etme (UTC varsayar).
export function trDate(isoDate: string, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('tr-TR', opts);
}

/** offset 0 = içinde bulunulan dönem, -1 = önceki, +1 = sonraki. */
export function periodRange(mode: Mode, offset: number, today = new Date()) {
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();

  if (mode === 'gun') {
    const day = iso(new Date(y, m, d + offset));
    return { start: day, end: day, label: trDate(day) };
  }

  if (mode === 'hafta') {
    // Pazartesi başlangıcı — AdminEndpoints.cs:169 ile birebir aynı idiom.
    const back = ((today.getDay() + 6) % 7) - offset * 7;
    const start = iso(new Date(y, m, d - back));
    const end = iso(new Date(y, m, d - back + 6));
    return { start, end, label: `${trDate(start, { day: '2-digit', month: 'short' })} – ${trDate(end)}` };
  }

  const first = new Date(y, m + offset, 1);
  const last = new Date(y, m + offset + 1, 0); // 0. gün = önceki ayın son günü
  return { start: iso(first), end: iso(last), label: first.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) };
}
