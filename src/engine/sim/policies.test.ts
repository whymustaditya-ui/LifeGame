import { describe, it, expect } from 'vitest';
import { SAMPLE_CARDS } from '../../content/sample';
import { createRun } from '../run';
import { toVisible } from '../visible';
import { buildTables, pickFor } from './policies';

const japan = SAMPLE_CARDS.find((c) => c.id === 'japan_trip')!;
const run = createRun('pol', SAMPLE_CARDS);
const v = { ...toVisible(run.state), emergencyMonths: 4, debt: { kpr: 0, pinjol: 0, cardDebt: 0 } };

describe('player styles and tables', () => {
  it('frugal skips the trip, yolo books it, balanced picks Bali', () => {
    expect(pickFor('frugal')(japan, v, run)).toBe('skip');
    expect(pickFor('yolo')(japan, v, run)).toBe('book');
    expect(pickFor('balanced')(japan, v, run)).toBe('bali');
  });
  it('random is deterministic per seed', () => {
    expect(pickFor('random')(japan, v, run)).toBe(pickFor('random')(japan, v, run));
  });
  it('builds 101 ascending quantiles spanning min to max', () => {
    const t = buildTables(Array.from({ length: 500 }, (_, i) => ({ netWorth: i * 1_000, luck: 250 - i })));
    expect(t.netWorth).toHaveLength(101);
    expect(t.netWorth[0]).toBe(0);
    expect(t.netWorth[100]).toBe(499_000);
    expect(t.luck.every((x, i, a) => i === 0 || a[i - 1]! <= x)).toBe(true);
  });
});

describe('player style fixes from the final review', () => {
  it('frugal pays off pinjol instead of letting it grow', () => {
    const payoff = SAMPLE_CARDS.find((c) => c.id === 'pinjol_payoff')!;
    const inDebt = { ...run, state: { ...run.state, fin: { ...run.state.fin, cash: 20_000_000, pinjol: 10_000_000 } } };
    expect(pickFor('frugal')(payoff, toVisible(inDebt.state), inDebt)).toBe('pay_all');
  });
});
