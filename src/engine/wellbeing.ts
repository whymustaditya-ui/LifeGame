import { FOMO_FACTOR, ODDS_BAD, ODDS_GOOD, STRESS_FACTOR } from './config';
import type { LifeStage, Temperament, WellbeingLevel } from './types';

/** Seger 70+, Oke 40 to 69, Capek 20 to 39, Burnout under 20 (spec 5.6). */
export function levelOf(score: number): WellbeingLevel {
  if (score >= 70) return 'seger';
  if (score >= 40) return 'oke';
  if (score >= 20) return 'capek';
  return 'burnout';
}

/** Early career to 29, building 30 to 39, sandwich and peak 40 to 49, pre-retirement 50 and up (spec 5.1). */
export function stageOf(age: number): LifeStage {
  if (age < 30) return 'early';
  if (age < 40) return 'building';
  if (age < 50) return 'peak';
  return 'preretire';
}

export function oddsMultiplier(level: WellbeingLevel, tone: 'good' | 'bad'): number {
  return tone === 'bad' ? ODDS_BAD[level] : ODDS_GOOD[level];
}

export function stressFactor(t: Temperament): number {
  return STRESS_FACTOR[t];
}

export function fomoFactor(t: Temperament): number {
  return FOMO_FACTOR[t];
}

/** Negative deltas hit harder or softer by temperament; the result is clamped to 0..100. */
export function applyWellbeingDelta(score: number, delta: number, t: Temperament): number {
  const scaled = delta < 0 ? Math.round(delta * STRESS_FACTOR[t]) : Math.round(delta);
  return Math.min(100, Math.max(0, score + scaled));
}
