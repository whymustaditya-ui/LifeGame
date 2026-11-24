import { choose, createRun, currentCard, endYear, toVisible } from '../engine';
import type { Card, Career, Run, VisibleState, WellbeingLevel } from '../engine';

export type CareerEvent = 'promoted' | 'fired' | 'rehired';

export interface Recap {
  /** Inclusive span of the years just closed. */
  fromAge: number; toAge: number;
  /** Net worth at the end of toAge, and the change since the previous recap (or the start). */
  netWorth: number; netWorthChange: number;
  employed: boolean; titleKey: string; monthlyIncome: number;
  /** The feeling at the end of toAge. */
  level: WellbeingLevel;
  /** An event always ends the span, so it belongs to toAge. */
  event: CareerEvent | null;
}

export type Screen =
  | { name: 'lottery' }
  | { name: 'card' }
  | { name: 'outcome'; before: VisibleState }
  | { name: 'recap'; recap: Recap }
  | { name: 'report' };

export interface Game { run: Run; screen: Screen; startWorth: number }

function expectScreen(game: Game, name: Screen['name'], action: string): void {
  if (game.screen.name !== name) throw new Error(`${action}: wrong screen`);
}

export function startGame(seed: string, content: readonly Card[]): Game {
  const run = createRun(seed, content);
  return { run, screen: { name: 'lottery' }, startWorth: toVisible(run.state).netWorth };
}

export function careerEvent(before: Career, after: Career): CareerEvent | null {
  if (!before.employed && after.employed) return 'rehired';
  if (before.employed && !after.employed) return 'fired';
  if (after.level > before.level) return 'promoted';
  return null;
}

/** Closes years until there is something to show, so quiet years fast-forward into one recap (spec 5.1). */
export function closeYears(game: Game, content: readonly Card[]): Game {
  const prev = game.run.state.history.at(-1)?.netWorth ?? game.startWorth;
  const fromAge = game.run.state.age;
  let run = game.run;
  let event: CareerEvent | null = null;
  do {
    const before = run.state.career;
    run = endYear(run, content);
    event = careerEvent(before, run.state.career);
  } while (!run.finished && run.queue.length === 0 && event === null);
  const last = run.state.history.at(-1);
  if (!last) throw new Error('closeYears: no year was closed');
  const { employed, titleKey, monthlyIncome } = run.state.career;
  const recap: Recap = {
    fromAge, toAge: last.age, netWorth: last.netWorth, netWorthChange: last.netWorth - prev,
    employed, titleKey, monthlyIncome, level: last.level, event,
  };
  return { ...game, run, screen: { name: 'recap', recap } };
}

/** The next screen once the current one is done: the next card, the report, or the year's recap. */
function moveOn(game: Game, content: readonly Card[]): Game {
  if (game.run.finished) return { ...game, screen: { name: 'report' } };
  if (currentCard(game.run, content)) return { ...game, screen: { name: 'card' } };
  return closeYears(game, content);
}

export function leaveLottery(game: Game, content: readonly Card[]): Game {
  expectScreen(game, 'lottery', 'leaveLottery');
  return moveOn(game, content);
}

export function pickChoice(game: Game, content: readonly Card[], choiceId: string): Game {
  expectScreen(game, 'card', 'pickChoice');
  const before = toVisible(game.run.state);
  return { ...game, run: choose(game.run, content, choiceId), screen: { name: 'outcome', before } };
}

/** Only reached after the outcome sheet was left, so run.last is always read before endYear clears it. */
export function leaveOutcome(game: Game, content: readonly Card[]): Game {
  expectScreen(game, 'outcome', 'leaveOutcome');
  return moveOn(game, content);
}

export function leaveRecap(game: Game, content: readonly Card[]): Game {
  expectScreen(game, 'recap', 'leaveRecap');
  return moveOn(game, content);
}

export function shownCard(game: Game, content: readonly Card[]): Card | null {
  if (game.screen.name === 'card') return currentCard(game.run, content);
  if (game.screen.name === 'outcome') {
    const id = game.run.last?.cardId;
    return content.find((c) => c.id === id) ?? null;
  }
  return null;
}
