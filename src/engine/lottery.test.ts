import { describe, it, expect } from 'vitest';
import { rollStart, startLuckPoints, startLuckPercentile } from './lottery';

describe('birth lottery', () => {
  it('is deterministic', () => expect(rollStart('demo')).toEqual(rollStart('demo')));
  it('sets start age from education', () => {
    for (let i = 0; i < 200; i++) {
      const p = rollStart(`s${i}`);
      expect(p.startAge).toBe({ highschool: 18, diploma: 21, degree: 22 }[p.education]);
    }
  });
  it('matches the family odds over 20,000 seeds', () => {
    const n = 20_000; const c = { poor: 0, middle: 0, rich: 0 };
    for (let i = 0; i < n; i++) c[rollStart(`f${i}`).family]++;
    expect(Math.abs(c.poor / n - 0.35)).toBeLessThan(0.015);
    expect(Math.abs(c.rich / n - 0.15)).toBeLessThan(0.015);
  });
  it('scores the worst and best starts', () => {
    expect(startLuckPoints({ family: 'poor', education: 'highschool', supportsParents: true, temperament: 'anxious' })).toBe(-65);
    expect(startLuckPoints({ family: 'rich', education: 'degree', supportsParents: false, temperament: 'steady' })).toBe(45);
  });
  it('ranks starts by percentile', () => {
    // Ruling: the worst start holds 9.8% of all starts, so mid-rank gives 4.9, which rounds to 5.
    expect(startLuckPercentile(-65)).toBeLessThanOrEqual(5);
    expect(startLuckPercentile(45)).toBeGreaterThan(95);
    expect(startLuckPercentile(-20)).toBeLessThanOrEqual(startLuckPercentile(0));
  });
});
