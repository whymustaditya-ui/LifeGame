/** 101 ascending values: the 0th to 100th percentile of a simulated distribution. */
export type QuantileTable = readonly number[];

/** Percentile of x by linear interpolation between neighbouring quantiles, clamped to 0..100 and rounded. */
export function percentileOf(x: number, t: QuantileTable): number {
  const last = t.length - 1;
  const first = t[0];
  const top = t[last];
  if (first === undefined || top === undefined) throw new Error('percentileOf: empty quantile table');
  if (x <= first) return 0;
  if (x >= top) return 100;
  for (let i = 0; i < last; i++) {
    const lo = t[i] as number;
    const hi = t[i + 1] as number;
    if (x >= lo && x < hi) return Math.round(((i + (x - lo) / (hi - lo)) / last) * 100);
  }
  return 100;
}
