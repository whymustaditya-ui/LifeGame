import type { WellbeingLevel } from '../../engine';

export interface Point { x: number; y: number }

const oneDecimal = (n: number): number => Math.round(n * 10) / 10;

/** Scales values into a width by height box; y grows downward. The range includes 0 unless one is given. */
export function toPoints(values: readonly number[], width: number, height: number, range?: { min: number; max: number }): Point[] {
  const min = range?.min ?? Math.min(0, ...values);
  const max = range?.max ?? Math.max(...values, min + 1);
  const n = values.length;
  return values.map((v, i) => ({
    x: oneDecimal(n === 1 ? 0 : (i * width) / (n - 1)),
    y: oneDecimal(height - ((v - min) / (max - min)) * height),
  }));
}

export function linePath(points: readonly Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
}

export function areaPath(points: readonly Point[], height: number): string {
  return `${linePath(points)} V${height} H0 Z`;
}

/** Index of the largest one-step fall, or null when nothing falls. */
export function biggestDrop(values: readonly number[]): number | null {
  let best: number | null = null;
  let worst = 0;
  for (let i = 1; i < values.length; i++) {
    const fall = (values[i - 1] as number) - (values[i] as number);
    if (fall > worst) {
      worst = fall;
      best = i;
    }
  }
  return best;
}

/** Runs of Capek or Burnout years, as inclusive index ranges. */
export function strainedBands(levels: readonly WellbeingLevel[]): { start: number; end: number }[] {
  const strained = (l: WellbeingLevel | undefined): boolean => l === 'capek' || l === 'burnout';
  const bands: { start: number; end: number }[] = [];
  levels.forEach((l, i) => {
    if (!strained(l)) return;
    if (strained(levels[i - 1]) && bands.length > 0) {
      const last = bands[bands.length - 1]!;
      bands[bands.length - 1] = { ...last, end: i };
    } else {
      bands.push({ start: i, end: i });
    }
  });
  return bands;
}
