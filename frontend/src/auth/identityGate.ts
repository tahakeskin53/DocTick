// Önbelleğin ne zaman atılacağına karar veren saf mantık. Auth.tsx'ten ayrı durur ki
// DOM/React olmadan test edilebilsin (identityGate.test.ts) — periodRange.ts ile aynı desen.

/**
 * Bir kimlikten AYRILIRKEN true (çıkış ya da hesap değişimi).
 * İlk kimlik atamasında (null → A) bilerek false: o an önbellek zaten boş ve temizlemek
 * index.html'deki boot isteğiyle beslenen sorguyu iptal edip fazladan bir istek doğururdu.
 */
export const leavesIdentity = (prev: number | null, next: number | null) =>
  prev !== null && prev !== next;
