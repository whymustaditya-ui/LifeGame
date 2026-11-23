import { monthlyCosts, netWorth } from './state';
import { levelOf, stageOf } from './wellbeing';
import type { GameState, VisibleState } from './types';

const NO_COSTS_MONTHS = 99;

/** What the player could check in real life (spec 5.3). Never exposes the wellbeing number, people or job security. */
export function toVisible(s: GameState): VisibleState {
  const costs = monthlyCosts(s);
  const emergencyMonths = costs > 0 ? Math.round((s.fin.cash / costs) * 10) / 10 : NO_COSTS_MONTHS;
  return {
    age: s.age,
    stage: stageOf(s.age),
    cash: s.fin.cash,
    emergencyMonths,
    index: s.fin.index,
    property: s.fin.property,
    debt: { kpr: s.fin.kpr, pinjol: s.fin.pinjol, cardDebt: s.fin.cardDebt },
    insured: s.fin.insured,
    netWorth: netWorth(s.fin),
    employed: s.career.employed,
    monthlyIncome: s.career.monthlyIncome,
    titleKey: s.career.titleKey,
    monthlyCosts: costs,
    wellbeingLevel: levelOf(s.wellbeing),
    married: s.married,
    children: s.children,
    supportsParents: s.start.supportsParents,
    plan: s.plan,
  };
}
