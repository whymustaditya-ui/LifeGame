import { describe, it, expect } from 'vitest';
import { draw, keyOf } from './rng';

describe('draw', () => {
  it('is deterministic for the same seed and key', () => {
    expect(draw('abc', '27|deal|0')).toBe(draw('abc', '27|deal|0'));
  });
  it('stays in [0, 1)', () => {
    for (let i = 0; i < 10_000; i++) {
      const x = draw('abc', `k${i}`);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it('differs across keys and seeds', () => {
    expect(draw('abc', '27|deal|0')).not.toBe(draw('abc', '27|deal|1'));
    expect(draw('abc', '27|deal|0')).not.toBe(draw('abd', '27|deal|0'));
  });
  it('handles any seed string', () => {
    for (const seed of ['', '🙂', 'x'.repeat(10_000)]) {
      const x = draw(seed, '22|lottery|family');
      expect(Number.isFinite(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(draw(seed, '22|lottery|family')).toBe(x);
    }
  });
  it('averages close to 0.5', () => {
    let sum = 0;
    for (let i = 0; i < 10_000; i++) sum += draw('mean', `k${i}`);
    expect(Math.abs(sum / 10_000 - 0.5)).toBeLessThan(0.02);
  });
});

describe('keyOf', () => {
  it('formats age, stream and id', () => {
    expect(keyOf(27, 'deal', 0)).toBe('27|deal|0');
  });
});
