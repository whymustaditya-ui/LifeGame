import type { DecisionRecord, LetterGrade } from './types';

const LETTERS: readonly (readonly [number, LetterGrade])[] = [
  [4.6, 'A'], [4.3, 'A-'], [4.0, 'B+'], [3.7, 'B'], [3.4, 'B-'], [3.1, 'C+'],
  [2.8, 'C'], [2.5, 'C-'], [2.2, 'D+'], [1.9, 'D'], [1.6, 'D-'],
];

export function averageScore(ds: readonly DecisionRecord[]): number | null {
  if (ds.length === 0) return null;
  return ds.reduce((sum, d) => sum + d.score, 0) / ds.length;
}

/** Letter grade for an average decision score on the five-step scale; no decisions reads as C (spec 5.7). */
export function letterOf(avg: number | null): LetterGrade {
  if (avg === null) return 'C';
  return LETTERS.find(([min]) => avg >= min)?.[1] ?? 'E';
}
