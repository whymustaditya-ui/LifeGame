import type { Locale } from '../../engine';

const NUMBER_LOCALE: Readonly<Record<Locale, string>> = { en: 'en-US', jaksel: 'id-ID' };
const DECIMAL: Readonly<Record<Locale, string>> = { en: '.', jaksel: ',' };
const UNIT_GAP: Readonly<Record<Locale, string>> = { en: '', jaksel: ' ' };
/** Largest first. English uses K, M, B, T; Indonesian ribu, juta, miliar, triliun. */
const UNITS: Readonly<Record<Locale, readonly (readonly [number, string])[]>> = {
  en: [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']],
  jaksel: [[1e12, 'T'], [1e9, 'M'], [1e6, 'jt'], [1e3, 'rb']],
};
const ONE_DECIMAL_BELOW = 10;
const STEP = 1000;

const sign = (n: number): string => (n < 0 ? '-' : '');

/** One decimal below 10, a whole number from 10 up. */
const roundShort = (v: number): number => (v < ONE_DECIMAL_BELOW ? Math.round(v * 10) / 10 : Math.round(v));

/** Exact whole Rupiah with the locale's thousands separators. */
export function formatRupiah(n: number, locale: Locale): string {
  const digits = new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: 0 }).format(Math.abs(Math.round(n)));
  return `${sign(n)}Rp${digits}`;
}

/** Short money for tight spaces: Rp42M or Rp42 jt. */
export function formatShort(n: number, locale: Locale): string {
  const abs = Math.abs(n);
  const units = UNITS[locale];
  const found = units.findIndex(([size]) => abs >= size);
  if (found === -1) return `${sign(n)}Rp${Math.round(abs)}`;
  let i = found;
  // Rounding 999.6 up to 1000 moves to the next unit.
  while (i > 0 && roundShort(abs / units[i]![0]) >= STEP) i -= 1;
  const [size, label] = units[i]!;
  const value = String(roundShort(abs / size)).replace('.', DECIMAL[locale]);
  return `${sign(n)}Rp${value}${UNIT_GAP[locale]}${label}`;
}

export function formatDelta(n: number, locale: Locale): string {
  return `${n > 0 ? '+' : ''}${formatShort(n, locale)}`;
}

export function formatMonths(m: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: 1 }).format(m);
}

/** Top or bottom share, never 0%. The same words in both languages. */
export function rankBand(pct: number): string {
  return pct >= 50 ? `Top ${Math.max(1, 100 - pct)}%` : `Bottom ${Math.max(1, pct)}%`;
}
