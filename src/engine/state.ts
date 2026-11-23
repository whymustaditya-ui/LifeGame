import {
  CHILD_COST, PARENT_SUPPORT, START_CASH, START_INCOME, START_LIFESTYLE, START_PEOPLE,
  START_SECURITY, START_WELLBEING,
} from './config';
import { expectedStartLuck } from './lottery';
import type { Finances, GameState, StartProfile } from './types';

export function initialState(seed: string, start: StartProfile): GameState {
  const income = START_INCOME[start.education];
  return {
    seed,
    age: start.startAge,
    start,
    fin: { cash: START_CASH[start.family], index: 0, property: 0, kpr: 0, kprMonthly: 0, pinjol: 0, cardDebt: 0, insured: false },
    career: {
      employed: true, level: 0, monthlyIncome: income, lastIncome: income,
      titleKey: `${start.education}_0`, security: START_SECURITY,
    },
    monthlyLifestyle: START_LIFESTYLE,
    plan: null,
    wellbeing: START_WELLBEING,
    people: { ...START_PEOPLE },
    married: false,
    children: 0,
    capekYears: 0,
    burnoutYears: 0,
    flags: {},
    seen: [],
    history: [],
    decisions: [],
    luck: [{ age: start.startAge, source: 'start', expected: expectedStartLuck(), actual: start.luckPoints }],
  };
}

export function netWorth(fin: Finances): number {
  return fin.cash + fin.index + fin.property - fin.kpr - fin.pinjol - fin.cardDebt;
}

export function monthlyCosts(s: GameState): number {
  return s.monthlyLifestyle
    + (s.start.supportsParents ? PARENT_SUPPORT : 0)
    + s.children * CHILD_COST
    + s.fin.kprMonthly;
}
