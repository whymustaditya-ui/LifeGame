import { describe, it, expect } from 'vitest';
import { levelOf, stageOf, oddsMultiplier, applyWellbeingDelta } from './wellbeing';

describe('wellbeing helpers', () => {
  it('maps scores to levels at the boundaries', () => {
    expect([100, 70, 69, 40, 39, 20, 19, 0].map(levelOf))
      .toEqual(['seger', 'seger', 'oke', 'oke', 'capek', 'capek', 'burnout', 'burnout']);
  });
  it('maps ages to life stages', () => {
    expect([29, 30, 39, 40, 49, 50, 60].map(stageOf))
      .toEqual(['early', 'building', 'building', 'peak', 'peak', 'preretire', 'preretire']);
  });
  it('returns odds multipliers', () => {
    expect(oddsMultiplier('burnout', 'bad')).toBe(1.8);
    expect(oddsMultiplier('seger', 'good')).toBe(1.25);
  });
  it('scales only negative deltas by temperament and clamps', () => {
    expect(applyWellbeingDelta(50, -10, 'anxious')).toBe(35);
    expect(applyWellbeingDelta(50, -10, 'steady')).toBe(42);
    expect(applyWellbeingDelta(50, 10, 'anxious')).toBe(60);
    expect(applyWellbeingDelta(5, -20, 'impulsive')).toBe(0);
    expect(applyWellbeingDelta(95, 20, 'steady')).toBe(100);
  });
});
