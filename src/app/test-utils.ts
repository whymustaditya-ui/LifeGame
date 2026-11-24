import type { Card, GameState } from '../engine';
import { leaveLottery, leaveOutcome, leaveRecap, pickChoice, shownCard, startGame, type Game } from './flow';

/** 'ok' for luck cards, otherwise the first choice. Tests only. */
export function firstChoiceId(card: Card): string {
  if (card.kind === 'luck') return 'ok';
  const first = card.choices?.[0];
  if (!first) throw new Error(`firstChoiceId: ${card.id} has no choices`);
  return first.id;
}

/** One player step that always takes the first choice. */
export function advance(game: Game, content: readonly Card[]): Game {
  switch (game.screen.name) {
    case 'lottery': return leaveLottery(game, content);
    case 'card': {
      const card = shownCard(game, content);
      if (!card) throw new Error('advance: no card on the card screen');
      return pickChoice(game, content, firstChoiceId(card));
    }
    case 'outcome': return leaveOutcome(game, content);
    case 'recap': return leaveRecap(game, content);
    case 'report': throw new Error('advance: the run is over');
  }
}

/** The first game, starting with the one passed in, for which `done` holds. */
export function playUntil(game: Game, content: readonly Card[], done: (g: Game) => boolean, limit = 1000): Game {
  let g = game;
  for (let i = 0; i <= limit; i++) {
    if (done(g)) return g;
    if (g.screen.name === 'report') break;
    g = advance(g, content);
  }
  throw new Error('playUntil: condition never met');
}

/** A fresh game parked on the card screen showing cardId, with the state optionally patched. */
export function atCard(seed: string, content: readonly Card[], cardId: string, patch?: (s: GameState) => GameState): Game {
  const g = startGame(seed, content);
  const state = patch ? patch(g.run.state) : g.run.state;
  return { ...g, run: { ...g.run, state, queue: [cardId] }, screen: { name: 'card' } };
}
