import {
  FIRING_CHANCE, LUCK_CAREER, PEOPLE_DRIFT, PROMOTION_BASE, PROMOTION_MULT, PROMOTION_RAISE,
  RAISE_RATE, REHIRE_BASE, REHIRE_PAY, UNEMPLOYED_STRESS, WELLBEING_ANCHOR, WELLBEING_PULL, WORK_STRESS,
} from './config';
import { keyOf } from './rng';
import { applyWellbeingDelta, levelOf, stageOf } from './wellbeing';
import type { Career, GameState, LuckEntry, People, WellbeingLevel } from './types';

/** Random source bound to a seed: key in, [0, 1) out. */
export type Rnd = (key: string) => number;

interface CareerStep { career: Career; luck: LuckEntry[]; changed: boolean }

const clampPeople = (x: number): number => Math.min(100, Math.max(0, x));

function nextWellbeing(s: GameState): number {
  const pulled = s.wellbeing + Math.round((WELLBEING_ANCHOR - s.wellbeing) * WELLBEING_PULL);
  const stress = s.career.employed ? -WORK_STRESS : -UNEMPLOYED_STRESS;
  return applyWellbeingDelta(pulled, stress, s.start.temperament);
}

function driftPeople(p: People, level: WellbeingLevel): People {
  const d = PEOPLE_DRIFT[level];
  return {
    family: clampPeople(p.family + d),
    friend: clampPeople(p.friend + d),
    partner: p.partner === null ? null : clampPeople(p.partner + d),
  };
}

function employedStep(s: GameState, level: WellbeingLevel, rnd: Rnd): CareerStep {
  const c = s.career;
  // Warnings come before punishment (spec 5.6): firing needs a struggling year that already dealt a recovery card.
  const fireP = s.capekYears >= 1 ? FIRING_CHANCE[level] : 0;
  const fireLuck: LuckEntry[] = [];
  if (fireP > 0) {
    const fired = rnd(keyOf(s.age, 'career', 'fired')) < fireP;
    fireLuck.push({ age: s.age, source: 'fired', expected: fireP * LUCK_CAREER.fired, actual: fired ? LUCK_CAREER.fired : 0 });
    if (fired) {
      return { career: { ...c, employed: false, lastIncome: c.monthlyIncome, monthlyIncome: 0 }, luck: fireLuck, changed: true };
    }
  }
  const raised = Math.round(c.monthlyIncome * (1 + RAISE_RATE[level]));
  const promoP = PROMOTION_BASE[stageOf(s.age)] * PROMOTION_MULT[level];
  const promoted = rnd(keyOf(s.age, 'career', 'promotion')) < promoP;
  const promoLuck: LuckEntry = {
    age: s.age, source: 'promotion', expected: promoP * LUCK_CAREER.promotion, actual: promoted ? LUCK_CAREER.promotion : 0,
  };
  const level2 = promoted ? c.level + 1 : c.level;
  return {
    career: {
      ...c,
      monthlyIncome: promoted ? Math.round(raised * (1 + PROMOTION_RAISE)) : raised,
      level: level2,
      titleKey: promoted ? `${s.start.education}_${level2}` : c.titleKey,
    },
    luck: [...fireLuck, promoLuck],
    changed: promoted,
  };
}

function unemployedStep(s: GameState, level: WellbeingLevel, rnd: Rnd): CareerStep {
  const p = REHIRE_BASE * PROMOTION_MULT[level];
  const hired = rnd(keyOf(s.age, 'career', 'rehire')) < p;
  const luck: LuckEntry[] = [{ age: s.age, source: 'rehire', expected: p * LUCK_CAREER.rehired, actual: hired ? LUCK_CAREER.rehired : 0 }];
  if (!hired) return { career: s.career, luck, changed: false };
  return { career: { ...s.career, employed: true, monthlyIncome: Math.round(s.career.lastIncome * REHIRE_PAY) }, luck, changed: true };
}

/** One year of wellbeing, relationships and career (spec 5.6). Luck entries are returned, not appended. */
export function lifeTick(s: GameState, rnd: Rnd): { state: GameState; luck: LuckEntry[]; careerChanged: boolean } {
  const wellbeing = nextWellbeing(s);
  const level = levelOf(wellbeing);
  const struggling = level === 'capek' || level === 'burnout';
  const step = s.career.employed ? employedStep(s, level, rnd) : unemployedStep(s, level, rnd);
  return {
    state: {
      ...s,
      wellbeing,
      capekYears: struggling ? s.capekYears + 1 : 0,
      burnoutYears: s.burnoutYears + (level === 'burnout' ? 1 : 0),
      people: driftPeople(s.people, level),
      career: step.career,
    },
    luck: step.luck,
    careerChanged: step.changed,
  };
}
