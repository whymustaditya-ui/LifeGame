import { END_AGE } from './config';
import { dealYear } from './deal';
import { economyTick } from './economy';
import { lifeTick } from './life';
import { rollStart } from './lottery';
import { resolveChoice, type ChoiceResult } from './resolve';
import { draw } from './rng';
import { initialState, netWorth } from './state';
import { toVisible } from './visible';
import { levelOf } from './wellbeing';
import type { Card, GameState, VisibleState, YearRecord } from './types';

/** A run is plain data, so it saves to localStorage and restores exactly. Content stays in code. */
export interface Run {
  state: GameState;
  queue: string[];
  year: string[];
  last: ChoiceResult | null;
  finished: boolean;
}

export function createRun(seed: string, content: readonly Card[]): Run {
  const dealt = dealYear(initialState(seed, rollStart(seed)), content);
  return { state: dealt.state, queue: dealt.cardIds, year: dealt.cardIds, last: null, finished: false };
}

export function currentCard(run: Run, content: readonly Card[]): Card | null {
  const id = run.finished ? undefined : run.queue[0];
  if (id === undefined) return null;
  const card = content.find((c) => c.id === id);
  if (!card) throw new Error(`Unknown card ${id}`);
  return card;
}

export function choose(run: Run, content: readonly Card[], choiceId: string): Run {
  const card = currentCard(run, content);
  if (!card) throw new Error('choose: there is no current card');
  const { state, result } = resolveChoice(run.state, card, choiceId);
  return { ...run, state, queue: run.queue.slice(1), last: result };
}

/** Closes the year (economy, then life), records it, and deals the next year or finishes after END_AGE. */
export function endYear(run: Run, content: readonly Card[]): Run {
  if (run.finished) throw new Error('endYear: the run is finished');
  if (run.queue.length > 0) throw new Error('endYear: cards are still queued');
  const afterEconomy = economyTick(run.state);
  const life = lifeTick(afterEconomy, (key) => draw(afterEconomy.seed, key));
  const s = life.state;
  const record: YearRecord = { age: s.age, netWorth: netWorth(s.fin), wellbeing: s.wellbeing, level: levelOf(s.wellbeing), events: [...run.year] };
  const closed: GameState = {
    ...s,
    flags: life.careerChanged ? { ...s.flags, career_changed: true } : s.flags,
    luck: [...s.luck, ...life.luck],
    history: [...s.history, record],
  };
  if (closed.age >= END_AGE) return { state: closed, queue: [], year: [], last: null, finished: true };
  const dealt = dealYear({ ...closed, age: closed.age + 1 }, content);
  return { state: dealt.state, queue: dealt.cardIds, year: dealt.cardIds, last: null, finished: false };
}

export function serialize(run: Run): string {
  return JSON.stringify(run);
}

function isRun(x: unknown): x is Run {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Record<string, unknown>;
  const state = r.state;
  return Array.isArray(r.queue) && Array.isArray(r.year) && typeof r.finished === 'boolean'
    && typeof state === 'object' && state !== null && typeof (state as Record<string, unknown>).seed === 'string';
}

/** Restores a saved run. Throws on anything that is not a saved run, so a corrupt save never half-loads. */
export function deserialize(json: string): Run {
  const parsed: unknown = JSON.parse(json);
  if (!isRun(parsed)) throw new Error('deserialize: not a saved run');
  return parsed;
}

export function playToEnd(
  seed: string,
  content: readonly Card[],
  pick: (card: Card, v: VisibleState, run: Run) => string,
): Run {
  let run = createRun(seed, content);
  while (!run.finished) {
    const card = currentCard(run, content);
    run = card ? choose(run, content, pick(card, toVisible(run.state), run)) : endYear(run, content);
  }
  return run;
}
