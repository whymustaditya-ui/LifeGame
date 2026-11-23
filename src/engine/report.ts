import { archetypeOf, type ArchetypeKey } from './archetype';
import { averageScore, letterOf } from './grading';
import { startLuckPercentile } from './lottery';
import { percentileOf, type QuantileTable } from './percentile';
import { netWorth } from './state';
import { levelOf } from './wellbeing';
import type { DecisionRecord, GameState, LetterGrade, LuckEntry, People, WellbeingLevel } from './types';

export interface Report {
  finalAge: number; netWorth: number; netWorthPct: number;
  wellbeingFinal: number; wellbeingLevel: WellbeingLevel; avgWellbeing: number;
  grade: LetterGrade; gradeAvg: number | null; luck: number; luckPct: number; startLuckPct: number;
  relationships: 'strong' | 'okay' | 'strained'; archetype: ArchetypeKey;
  best: DecisionRecord | null; worst: DecisionRecord | null;
  series: { age: number; netWorth: number; wellbeing: number }[];
}

/** Luck is how the dice landed against the odds at the time: the sum of actual minus expected (spec 5.8). */
export function luckScore(entries: readonly LuckEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.actual - e.expected), 0);
}

function relationshipsOf(p: People): Report['relationships'] {
  const values = p.partner === null ? [p.family, p.friend] : [p.family, p.friend, p.partner];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean >= 65) return 'strong';
  if (mean >= 40) return 'okay';
  return 'strained';
}

/** Highest (best) or lowest (worst) score; ties go to the earliest decision. */
function extreme(ds: readonly DecisionRecord[], better: (a: number, b: number) => boolean): DecisionRecord | null {
  return ds.reduce<DecisionRecord | null>((pick, d) => (pick === null || better(d.score, pick.score) ? d : pick), null);
}

export function buildReport(s: GameState, tables: { netWorth: QuantileTable; luck: QuantileTable }): Report {
  const worth = netWorth(s.fin);
  const netWorthPct = percentileOf(worth, tables.netWorth);
  const avgWellbeing = s.history.length === 0
    ? s.wellbeing
    : Math.round(s.history.reduce((sum, h) => sum + h.wellbeing, 0) / s.history.length);
  const gradeAvg = averageScore(s.decisions);
  const luck = luckScore(s.luck);
  const luckPct = percentileOf(luck, tables.luck);
  return {
    finalAge: s.age,
    netWorth: worth,
    netWorthPct,
    wellbeingFinal: s.wellbeing,
    wellbeingLevel: levelOf(s.wellbeing),
    avgWellbeing,
    grade: letterOf(gradeAvg),
    gradeAvg,
    luck,
    luckPct,
    startLuckPct: startLuckPercentile(s.start.luckPoints),
    relationships: relationshipsOf(s.people),
    archetype: archetypeOf({
      burnoutYears: s.burnoutYears, netWorthPct, avgWellbeing, luckPct, gradeAvg, supportsParents: s.start.supportsParents,
    }),
    best: extreme(s.decisions, (a, b) => a > b),
    worst: extreme(s.decisions, (a, b) => a < b),
    series: s.history.map((h) => ({ age: h.age, netWorth: h.netWorth, wellbeing: h.wellbeing })),
  };
}
