import { expect, it } from 'vitest';
import { formatDelta, formatMonths, formatRupiah, formatShort, rankBand } from './format';

it.each([
  [0, 'Rp0', 'Rp0'],
  [950, 'Rp950', 'Rp950'],
  [400_000, 'Rp400K', 'Rp400 rb'],
  [1_500_000, 'Rp1.5M', 'Rp1,5 jt'],
  [42_000_000, 'Rp42M', 'Rp42 jt'],
  [999_600_000, 'Rp1B', 'Rp1 M'],
  [8_412_345_678, 'Rp8.4B', 'Rp8,4 M'],
  [-2_585_005_870, '-Rp2.6B', '-Rp2,6 M'],
  [1_250_000_000_000, 'Rp1.3T', 'Rp1,3 T'],
])('formatShort(%i)', (n, en, jaksel) => {
  expect(formatShort(n, 'en')).toBe(en);
  expect(formatShort(n, 'jaksel')).toBe(jaksel);
});
it('formats exact Rupiah, deltas, months and rank bands', () => {
  expect(formatRupiah(8_500_000, 'en')).toBe('Rp8,500,000');
  expect(formatRupiah(-10_000_000, 'jaksel')).toBe('-Rp10.000.000');
  expect(formatDelta(15_000_000, 'en')).toBe('+Rp15M');
  expect(formatDelta(-10_000_000, 'jaksel')).toBe('-Rp10 jt');
  expect(formatMonths(6, 'en')).toBe('6');
  expect(formatMonths(4.2, 'jaksel')).toBe('4,2');
  expect([0, 30, 50, 80, 100].map(rankBand)).toEqual(['Bottom 1%', 'Bottom 30%', 'Top 50%', 'Top 20%', 'Top 1%']);
});
