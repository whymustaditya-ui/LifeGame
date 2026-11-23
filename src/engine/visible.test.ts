import { describe, it, expect } from 'vitest';
import { initialState, monthlyCosts, netWorth } from './state';
import { toVisible } from './visible';
import { deepFreeze, makeState } from './test-utils';

describe('initial state and visible snapshot', () => {
  it('builds the initial state from the start profile', () => {
    const s = initialState('x', { family: 'poor', education: 'highschool', supportsParents: true, temperament: 'anxious', startAge: 18, luckPoints: -65 });
    expect(s.age).toBe(18);
    expect(s.fin.cash).toBe(2_000_000);
    expect(s.career.monthlyIncome).toBe(5_400_000);
    expect(s.luck[0]).toMatchObject({ source: 'start', actual: -65 });
  });
  it('computes net worth including debt', () => {
    expect(netWorth({ cash: 10_000_000, index: 5_000_000, property: 0, kpr: 0, kprMonthly: 0, pinjol: 20_000_000, pinjolPrincipal: 0, cardDebt: 0, insured: false })).toBe(-5_000_000);
  });
  it('sums monthly costs', () => {
    const s = makeState({ children: 1, start: { ...makeState().start, supportsParents: true }, fin: { ...makeState().fin, kprMonthly: 3_000_000 } });
    expect(monthlyCosts(s)).toBe(10_000_000);
  });
  it('reports emergency months and hides felt values', () => {
    const v = toVisible(deepFreeze(makeState({ fin: { ...makeState().fin, cash: 7_000_000 } })));
    expect(v.emergencyMonths).toBe(2);
    expect(v.stage).toBe('early');
    expect(Object.keys(v)).not.toContain('wellbeing');
    expect(Object.keys(v)).not.toContain('people');
  });
  it('uses 99 emergency months when there are no costs', () => {
    expect(toVisible(makeState({ monthlyLifestyle: 0 })).emergencyMonths).toBe(99);
  });
});
