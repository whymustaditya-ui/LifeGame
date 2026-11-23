import { describe, it, expect } from 'vitest';
import { lifeTick, type Rnd } from './life';
import { deepFreeze, makeState } from './test-utils';

const rndOf = (m: Record<string, number>): Rnd => (k) => m[k.split('|')[2] as string] ?? 0.99;

describe('lifeTick', () => {
  it('pulls wellbeing toward 55 and applies work stress', () => {
    expect(lifeTick(deepFreeze(makeState({ wellbeing: 81 })), rndOf({})).state.wellbeing).toBe(76);
  });
  it('counts consecutive capek years and resets them', () => {
    expect(lifeTick(makeState({ wellbeing: 25, capekYears: 2 }), rndOf({})).state.capekYears).toBe(3);
    expect(lifeTick(makeState({ wellbeing: 80, capekYears: 2 }), rndOf({})).state.capekYears).toBe(0);
  });
  it('drifts relationships by level and leaves a missing partner alone', () => {
    const r = lifeTick(makeState({ wellbeing: 5 }), rndOf({})).state.people;
    expect(r.family).toBe(52);
    expect(r.partner).toBeNull();
  });
  it('raises, then promotes when the draw is under the odds', () => {
    const r = lifeTick(makeState({ wellbeing: 55, career: { ...makeState().career, monthlyIncome: 8_000_000 } }), rndOf({ promotion: 0.1 }));
    expect(r.state.career.monthlyIncome).toBe(9_476_000);
    expect(r.state.career.level).toBe(1);
    expect(r.careerChanged).toBe(true);
    expect(r.luck).toContainEqual(expect.objectContaining({ source: 'promotion', actual: 20 }));
    expect(r.luck.find((e) => e.source === 'promotion')?.expected).toBeCloseTo(3.6);
  });
  it('fires only at burnout', () => {
    expect(lifeTick(makeState({ wellbeing: 30 }), rndOf({ fired: 0 })).state.career.employed).toBe(true);
    const r = lifeTick(makeState({ wellbeing: 5 }), rndOf({ fired: 0.1 }));
    expect(r.state.career.employed).toBe(false);
    expect(r.state.career.monthlyIncome).toBe(0);
    expect(r.luck).toContainEqual(expect.objectContaining({ source: 'fired', expected: -10, actual: -40 }));
  });
  it('rehires at 90% of the last income', () => {
    const r = lifeTick(makeState({ wellbeing: 60, career: { ...makeState().career, employed: false, monthlyIncome: 0, lastIncome: 10_000_000 } }), rndOf({ rehire: 0.5 }));
    expect(r.state.career.monthlyIncome).toBe(9_000_000);
  });
  it('hits anxious unemployed players harder', () => {
    const s = makeState({ wellbeing: 55, start: { ...makeState().start, temperament: 'anxious' }, career: { ...makeState().career, employed: false, monthlyIncome: 0 } });
    expect(lifeTick(s, rndOf({})).state.wellbeing).toBe(40);
  });
});
