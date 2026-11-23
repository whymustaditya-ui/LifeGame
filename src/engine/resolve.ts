import { applyEffect } from './effects';
import { draw, keyOf } from './rng';
import { toVisible } from './visible';
import type { Card, DecisionScore, GameState, Localized, Roll } from './types';

export interface ChoiceResult {
  cardId: string;
  choiceId: string;
  score: DecisionScore | null;
  roll: { hit: boolean; luck: number; expected: number } | null;
  message: Localized<string> | null;
}

interface Rolled { state: GameState; roll: { hit: boolean; luck: number; expected: number }; message: Localized<string> }

/** Rolls an outcome on the given key and records luck as actual against expected (spec 5.8). */
function rollOutcome(s: GameState, roll: Roll, key: string, source: string): Rolled {
  const p = Math.min(1, Math.max(0, roll.p(s)));
  const hit = draw(s.seed, key) < p;
  const outcome = hit ? roll.hit : roll.miss;
  const expected = p * roll.hit.luck + (1 - p) * roll.miss.luck;
  const after = applyEffect(s, outcome.effect(s));
  return {
    state: { ...after, luck: [...after.luck, { age: s.age, source, expected, actual: outcome.luck }] },
    roll: { hit, luck: outcome.luck, expected },
    message: outcome.copy,
  };
}

/** Resolves the player's choice on a card. Grading sees only the snapshot from before the effect (spec 5.7). */
export function resolveChoice(s: GameState, card: Card, choiceId: string): { state: GameState; result: ChoiceResult } {
  if (card.kind === 'luck') {
    if (choiceId !== 'ok') throw new Error(`Luck card ${card.id} only accepts ok, got ${choiceId}`);
    if (!card.roll) throw new Error(`Luck card ${card.id} has no roll`);
    const rolled = rollOutcome(s, card.roll, keyOf(s.age, 'luck', card.id), card.id);
    return { state: rolled.state, result: { cardId: card.id, choiceId, score: null, roll: rolled.roll, message: rolled.message } };
  }
  const choice = card.choices?.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} on ${card.id}`);
  const score = choice.grade ? choice.grade(toVisible(s)) : null;
  const afterEffect = applyEffect(s, choice.effect(s));
  const rolled = choice.roll ? rollOutcome(afterEffect, choice.roll, keyOf(s.age, 'outcome', card.id), card.id) : null;
  const base = rolled ? rolled.state : afterEffect;
  const decisions = score === null ? base.decisions : [...base.decisions, { age: s.age, cardId: card.id, choiceId, score }];
  return {
    state: { ...base, decisions },
    result: { cardId: card.id, choiceId, score, roll: rolled?.roll ?? null, message: rolled ? rolled.message : (choice.result ?? null) },
  };
}
