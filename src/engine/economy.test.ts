import { describe, it, expect } from 'vitest';
import { economyTick } from './economy';
import { netWorth } from './state';
import { deepFreeze, makeState } from './test-utils';

const base = () => makeState({ plan: 'half_index', monthlyLifestyle: 5_000_000,
  career: { ...makeState().career, monthlyIncome: 8_000_000 }, fin: { ...makeState().fin, cash: 10_000_000 } });

describe('economyTick', () => {
  it('saves salary plus THR with the half_index plan', () => {
    const s = economyTick(deepFreeze(base()));
    expect(s.fin.cash).toBe(32_000_000);
    expect(s.fin.index).toBe(22_000_000);
  });
  it('grows the opening index before contributions', () => {
    const s = economyTick(makeState({ plan: 'save_all', monthlyLifestyle: 6_500_000,
      career: { ...makeState().career, monthlyIncome: 6_000_000 }, fin: { ...makeState().fin, index: 100_000_000 } }));
    expect(s.fin.index).toBe(105_000_000);
  });
  it('turns a shortfall into pinjol and never leaves cash negative', () => {
    const s = economyTick(makeState({ start: { ...makeState().start, supportsParents: true },
      career: { ...makeState().career, employed: false, monthlyIncome: 0 }, fin: { ...makeState().fin, cash: 5_000_000 } }));
    expect(s.fin.cash).toBe(0);
    expect(s.fin.pinjol).toBe(61_000_000);
    expect(netWorth(s.fin)).toBe(-61_000_000);
  });
  it('compounds pinjol at 60% a year', () => {
    const s = economyTick(makeState({ monthlyLifestyle: 0, career: { ...makeState().career, employed: false, monthlyIncome: 0 },
      fin: { ...makeState().fin, cash: 0, pinjol: 10_000_000 } }));
    expect(s.fin.pinjol).toBe(16_000_000);
  });
  it('pays down the KPR', () => {
    const s = economyTick(makeState({ fin: { ...makeState().fin, kpr: 100_000_000, kprMonthly: 1_000_000 } }));
    expect(s.fin.kpr).toBe(93_000_000);
  });
});
