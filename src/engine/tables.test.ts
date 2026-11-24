import { expect, it } from 'vitest';
import { PERCENTILE_TABLES } from './tables';

it('ships 101 ascending quantiles for net worth and luck', () => {
  for (const t of [PERCENTILE_TABLES.netWorth, PERCENTILE_TABLES.luck]) {
    expect(t).toHaveLength(101);
    expect(t.every((x, i) => i === 0 || t[i - 1]! <= x)).toBe(true);
  }
});
