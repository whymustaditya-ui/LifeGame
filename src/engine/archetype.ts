export type ArchetypeKey = 'burnt_out' | 'rich_but_tired' | 'lucky_gambler' | 'unlucky_but_wise'
  | 'steady_compounder' | 'broke_but_happy' | 'sandwich_hero' | 'balanced' | 'getting_by';

export interface ArchetypeInput {
  burnoutYears: number; netWorthPct: number; avgWellbeing: number; luckPct: number;
  gradeAvg: number | null; supportsParents: boolean;
}

const NEUTRAL_GRADE = 3.0;

/** First matching rule wins (spec 5.10). */
export function archetypeOf(i: ArchetypeInput): ArchetypeKey {
  const g = i.gradeAvg ?? NEUTRAL_GRADE;
  if (i.burnoutYears >= 5) return 'burnt_out';
  if (i.netWorthPct >= 70 && i.avgWellbeing < 45) return 'rich_but_tired';
  if (i.luckPct >= 80 && g < 3.1) return 'lucky_gambler';
  if (i.luckPct <= 20 && g >= 3.7) return 'unlucky_but_wise';
  if (g >= 3.7 && i.netWorthPct >= 50 && i.avgWellbeing >= 50) return 'steady_compounder';
  if (i.netWorthPct < 30 && i.avgWellbeing >= 60) return 'broke_but_happy';
  if (i.supportsParents && g >= 3.4) return 'sandwich_hero';
  if (i.avgWellbeing >= 55 && i.netWorthPct >= 30) return 'balanced';
  return 'getting_by';
}
