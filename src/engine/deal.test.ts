import { describe, it, expect } from 'vitest';
import { dealYear } from './deal';
import { draw, keyOf } from './rng';
import { deepFreeze, findSeed, makeState } from './test-utils';
import type { Card } from './types';

const ALL = ['early', 'building', 'peak', 'preretire'] as const;
const card = (id: string, triggers?: Card['triggers']): Card => ({
  id, kind: 'dilemma', stages: ALL, repeatable: true, weight: 1, ...(triggers ? { triggers } : {}), copy: { en: id, jaksel: id },
});
const r1 = card('r1');
const cards: Card[] = [
  card('recovery', ['capek']),
  card('pinjol_payoff', ['pinjol']),
  card('money_plan', ['first_salary', 'career_change', 'married', 'child', 'kpr']),
  card('insurance_offer', ['first_job_insurance', 'family_insurance']),
  r1, card('r2'), card('r3'),
];

describe('dealYear', () => {
  it('puts recovery first and caps the year at two cards', () => {
    const s = makeState({ wellbeing: 25, fin: { ...makeState().fin, pinjol: 1 }, flags: { career_changed: true } });
    expect(dealYear(deepFreeze(s), cards).cardIds).toEqual(['recovery', 'pinjol_payoff']);
  });
  it('deals one money plan card even when several triggers fire', () => {
    const s = makeState({ flags: { career_changed: true, just_married: true, first_salary_seen: true, first_insurance_seen: true }, fin: { ...makeState().fin, insured: true } });
    expect(dealYear(s, cards).cardIds.filter((id) => id === 'money_plan')).toHaveLength(1);
  });
  it('is deterministic for the same seed and state', () => {
    const s = makeState({ flags: { first_salary_seen: true, first_insurance_seen: true } });
    expect(dealYear(s, cards)).toEqual(dealYear(s, cards));
  });
  it('gives random slot 0 the same draw whether or not a guaranteed card came first', () => {
    const seed = findSeed((x) => draw(x, keyOf(22, 'deal', 0)) < 0.2);
    const quiet = makeState({ seed, flags: { first_salary_seen: true, first_insurance_seen: true } });
    const busy = { ...quiet, flags: { ...quiet.flags, career_changed: true as const } };
    const randomIn = (ids: string[]) => ids.filter((id) => id.startsWith('r'));
    expect(randomIn(dealYear(busy, cards).cardIds)[0]).toBe(randomIn(dealYear(quiet, cards).cardIds)[0]);
  });
  it('has a quiet year when the pool runs dry', () => {
    const once = [{ ...r1, repeatable: false }];
    const s = makeState({ seen: ['r1'], flags: { first_salary_seen: true, first_insurance_seen: true } });
    expect(dealYear(s, once).cardIds).toEqual([]);
  });
  it('clears a one-shot flag only when its card is dealt', () => {
    const s = makeState({ flags: { career_changed: true, first_salary_seen: true, first_insurance_seen: true } });
    expect(dealYear(s, cards).state.flags.career_changed).toBeUndefined();
  });
});
