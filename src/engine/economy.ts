import {
  CARD_RATE, INDEX_RETURN, KPR_RATE, PINJOL_RATE, PLAN_CASH_SHARE, PROPERTY_GROWTH, THR_MONTHS,
} from './config';
import { monthlyCosts } from './state';
import type { GameState } from './types';

/** Splits a year's leftover by the money plan, or covers a shortfall from cash and then pinjol. */
function settle(cash: number, index: number, pinjol: number, leftover: number, cashShare: number) {
  if (leftover >= 0) {
    const toCash = Math.round(leftover * cashShare);
    return { cash: cash + toCash, index: index + (leftover - toCash), pinjol };
  }
  const shortfall = -leftover;
  const fromCash = Math.min(cash, shortfall);
  return { cash: cash - fromCash, index, pinjol: pinjol + (shortfall - fromCash) };
}

/** One year of money (spec 5.4). Deterministic. Amounts are inflation-adjusted Rupiah. */
export function economyTick(s: GameState): GameState {
  const f = s.fin;
  const grownIndex = Math.round(f.index * (1 + INDEX_RETURN));
  const property = Math.round(f.property * (1 + PROPERTY_GROWTH));
  const pinjolWithInterest = Math.round(f.pinjol * (1 + PINJOL_RATE));
  const cardDebt = Math.round(f.cardDebt * (1 + CARD_RATE));
  const kpr = Math.max(0, Math.round(f.kpr * (1 + KPR_RATE)) - f.kprMonthly * 12);
  const kprMonthly = kpr === 0 ? 0 : f.kprMonthly;

  const income = s.career.employed ? s.career.monthlyIncome * THR_MONTHS : 0;
  const leftover = income - monthlyCosts(s) * 12;
  const settled = settle(f.cash, grownIndex, pinjolWithInterest, leftover, PLAN_CASH_SHARE[s.plan ?? 'save_all']);

  return { ...s, fin: { ...f, ...settled, property, cardDebt, kpr, kprMonthly } };
}
