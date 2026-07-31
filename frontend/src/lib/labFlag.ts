export type Flag = 'low' | 'high' | 'normal';

export function labFlag(value: number, refLow: number | null, refHigh: number | null): Flag {
  if (refLow != null && value < refLow) return 'low';
  if (refHigh != null && value > refHigh) return 'high';
  return 'normal';
}
