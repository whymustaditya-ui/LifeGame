import { CARD_CHANCE, MAX_CARDS_PER_YEAR } from './config';
import { draw, keyOf } from './rng';
import { levelOf, stageOf } from './wellbeing';
import type { Card, GameState, Trigger } from './types';

/** One-shot flags a trigger consumes once its card is dealt. */
const CLEARS: Partial<Record<Trigger, string>> = {
  career_change: 'career_changed', married: 'just_married', child: 'just_child', kpr: 'just_kpr',
  family_insurance: 'family_insurance_due',
};
/** Flags a trigger sets once its card is dealt, so it never fires again. */
const MARKS: Partial<Record<Trigger, string>> = {
  first_salary: 'first_salary_seen', first_job_insurance: 'first_insurance_seen',
};

/** Guaranteed-card triggers in priority order; at most one money plan and one insurance trigger (spec 5.5). */
export function dueTriggers(s: GameState): Trigger[] {
  const f = s.flags;
  const level = levelOf(s.wellbeing);
  const moneyPlan: Trigger | null =
    f.career_changed ? 'career_change'
      : s.career.employed && !f.first_salary_seen ? 'first_salary'
        : f.just_married ? 'married'
          : f.just_child ? 'child'
            : f.just_kpr ? 'kpr'
              : null;
  const insurance: Trigger | null = s.fin.insured ? null
    : s.career.employed && !f.first_insurance_seen ? 'first_job_insurance'
      : f.family_insurance_due ? 'family_insurance'
        : null;
  return [
    ...(level === 'capek' || level === 'burnout' ? (['capek'] as const) : []),
    ...(s.fin.pinjol > 0 ? (['pinjol'] as const) : []),
    ...(moneyPlan ? [moneyPlan] : []),
    ...(insurance ? [insurance] : []),
  ];
}

function weightedPick(pool: readonly Card[], x: number): Card | undefined {
  const total = pool.reduce((sum, c) => sum + Math.max(0, c.weight), 0);
  if (total <= 0) return undefined;
  const target = x * total;
  let acc = 0;
  for (const c of pool) {
    acc += Math.max(0, c.weight);
    if (target < acc) return c;
  }
  return pool[pool.length - 1];
}

/** Deals up to two cards for the year: guaranteed cards by rule, then random slots keyed by slot index (spec 5.9). */
export function dealYear(s: GameState, content: readonly Card[]): { cardIds: string[]; state: GameState } {
  const isOk = (c: Card): boolean => c.eligible?.(s) ?? true;
  const guaranteed = dueTriggers(s).reduce<{ cards: Card[]; handled: Trigger[] }>((acc, t) => {
    if (acc.cards.length >= MAX_CARDS_PER_YEAR) return acc;
    const card = content.find((c) => (c.triggers?.includes(t) ?? false) && !acc.cards.includes(c) && isOk(c));
    return card ? { cards: [...acc.cards, card], handled: [...acc.handled, t] } : acc;
  }, { cards: [], handled: [] });

  const stage = stageOf(s.age);
  const randomSlots = MAX_CARDS_PER_YEAR - guaranteed.cards.length;
  const picked = Array.from({ length: randomSlots }, (_, i) => i).reduce<Card[]>((cards, i) => {
    if (draw(s.seed, keyOf(s.age, 'deal', 2 * i)) >= (CARD_CHANCE[i] ?? 0)) return cards;
    const pool = content.filter((c) => !(c.triggers?.length) && c.stages.includes(stage) && isOk(c)
      && (c.repeatable || !s.seen.includes(c.id)) && !cards.includes(c));
    const card = weightedPick(pool, draw(s.seed, keyOf(s.age, 'deal', 2 * i + 1)));
    return card ? [...cards, card] : cards;
  }, guaranteed.cards);

  const cleared = new Set(guaranteed.handled.flatMap((t) => (CLEARS[t] ? [CLEARS[t]] : [])));
  const marked = guaranteed.handled.flatMap((t) => (MARKS[t] ? [MARKS[t]] : []));
  const flags = Object.fromEntries([
    ...Object.entries(s.flags).filter(([k]) => !cleared.has(k)),
    ...marked.map((k) => [k, true] as const),
  ]) as Record<string, true>;
  const cardIds = picked.map((c) => c.id);
  return { cardIds, state: { ...s, seen: [...s.seen, ...cardIds], flags } };
}
