import {
  CARD_RATE, INDEX_RETURN, KPR_RATE, PINJOL_COST_CAP, PINJOL_RATE, PLAN_CASH_SHARE, PROPERTY_GROWTH, THR_MONTHS,
} from './config';
import { monthlyCosts } from './state';
import type { Finances, GameState } from './types';

type Liquid = Pick<Finances, 'cash' | 'index' | 'pinjol' | 'pinjolPrincipal'>;

/** Splits a leftover by the money plan. A shortfall comes from cash, then index funds, and only then pinjol. */
function settle(l: Liquid, leftover: number, cashShare: number): Liquid {
  if (leftover >= 0) {
    const toCash = Math.round(leftover * cashShare);
    return { ...l, cash: l.cash + toCash, index: l.index + (leftover - toCash) };
  }
  const shortfall = -leftover;
  const fromCash = Math.min(l.cash, shortfall);
  const fromIndex = Math.min(l.index, shortfall - fromCash);
  const borrowed = shortfall - fromCash - fromIndex;
  return { cash: l.cash - fromCash, index: l.index - fromIndex, pinjol: l.pinjol + borrowed, pinjolPrincipal: l.pinjolPrincipal + borrowed };
}

/** Pinjol grows at PINJOL_RATE but never past PINJOL_COST_CAP times what was borrowed. */
function pinjolAfterInterest(f: Finances): number {
  const grown = Math.round(f.pinjol * (1 + PINJOL_RATE));
  return f.pinjolPrincipal > 0 ? Math.min(grown, Math.max(f.pinjol, PINJOL_COST_CAP * f.pinjolPrincipal)) : grown;
}

/** One year of money (spec 5.4). Deterministic. Amounts are inflation-adjusted Rupiah. */
export function economyTick(s: GameState): GameState {
  const f = s.fin;
  const grownKpr = Math.round(f.kpr * (1 + KPR_RATE));
  const kprPaid = Math.min(f.kprMonthly * 12, grownKpr);
  const kpr = grownKpr - kprPaid;
  const income = s.career.employed ? s.career.monthlyIncome * THR_MONTHS : 0;
  const costs = (monthlyCosts(s) - f.kprMonthly) * 12 + kprPaid;
  const settled = settle(
    { cash: f.cash, index: Math.round(f.index * (1 + INDEX_RETURN)), pinjol: pinjolAfterInterest(f), pinjolPrincipal: f.pinjolPrincipal },
    income - costs,
    PLAN_CASH_SHARE[s.plan ?? 'save_all'],
  );
  return {
    ...s,
    fin: {
      ...f,
      ...settled,
      property: Math.round(f.property * (1 + PROPERTY_GROWTH)),
      cardDebt: Math.round(f.cardDebt * (1 + CARD_RATE)),
      kpr,
      kprMonthly: kpr === 0 ? 0 : f.kprMonthly,
    },
  };
}
