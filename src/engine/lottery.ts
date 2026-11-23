import {
  EDUCATION_ODDS, FAMILY_ODDS, PARENTS_ODDS, START_AGE, START_LUCK, TEMPERAMENT_ODDS,
} from './config';
import { draw, keyOf } from './rng';
import type { StartProfile } from './types';

type Profile = Pick<StartProfile, 'family' | 'education' | 'supportsParents' | 'temperament'>;

/** Picks the first key whose cumulative probability exceeds x, in the record's key order. */
function pick<K extends string>(odds: Readonly<Record<K, number>>, x: number): K {
  const entries = Object.entries(odds) as [K, number][];
  let acc = 0;
  for (const [key, p] of entries) {
    acc += p;
    if (x < acc) return key;
  }
  const last = entries[entries.length - 1];
  if (!last) throw new Error('pick: empty odds');
  return last[0];
}

export function startLuckPoints(p: Profile): number {
  return START_LUCK.family[p.family]
    + START_LUCK.education[p.education]
    + (p.supportsParents ? START_LUCK.parents : 0)
    + START_LUCK.temperament[p.temperament];
}

export function rollStart(seed: string): StartProfile {
  const roll = (name: string): number => draw(seed, keyOf(0, 'lottery', name));
  const family = pick(FAMILY_ODDS, roll('family'));
  const education = pick(EDUCATION_ODDS[family], roll('education'));
  const supportsParents = roll('parents') < PARENTS_ODDS[family];
  const temperament = pick(TEMPERAMENT_ODDS, roll('temperament'));
  const profile: Profile = { family, education, supportsParents, temperament };
  return { ...profile, startAge: START_AGE[education], luckPoints: startLuckPoints(profile) };
}

interface WeightedStart { points: number; p: number }

/** All 54 possible starts with their probabilities. Derived once from constants; never mutated. */
const ALL_STARTS: readonly WeightedStart[] = (() => {
  const out: WeightedStart[] = [];
  for (const [family, pf] of Object.entries(FAMILY_ODDS) as [Profile['family'], number][]) {
    for (const [education, pe] of Object.entries(EDUCATION_ODDS[family]) as [Profile['education'], number][]) {
      for (const supportsParents of [true, false]) {
        const pp = supportsParents ? PARENTS_ODDS[family] : 1 - PARENTS_ODDS[family];
        for (const [temperament, pt] of Object.entries(TEMPERAMENT_ODDS) as [Profile['temperament'], number][]) {
          out.push({ points: startLuckPoints({ family, education, supportsParents, temperament }), p: pf * pe * pp * pt });
        }
      }
    }
  }
  return out;
})();

export function expectedStartLuck(): number {
  return ALL_STARTS.reduce((sum, s) => sum + s.points * s.p, 0);
}

/** Mid-rank percentile: mass strictly below plus half the mass equal, times 100, rounded. */
export function startLuckPercentile(points: number): number {
  let below = 0;
  let equal = 0;
  for (const s of ALL_STARTS) {
    if (s.points < points) below += s.p;
    else if (s.points === points) equal += s.p;
  }
  return Math.round((below + equal / 2) * 100);
}
