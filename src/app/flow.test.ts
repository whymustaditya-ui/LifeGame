import { expect, it } from 'vitest';
import { CONTENT } from '../content';
import { END_AGE, toVisible } from '../engine';
import { makeState } from '../engine/test-utils';
import {
  careerEvent, leaveLottery, leaveOutcome, leaveRecap, pickChoice, shownCard, startGame,
  type Recap, type Screen,
} from './flow';
import { advance, playUntil } from './test-utils';

const SEED = 'flow-demo';

it('starts on the lottery with the starting net worth', () => {
  const g = startGame(SEED, CONTENT);
  expect(g.screen).toEqual({ name: 'lottery' });
  expect(g.startWorth).toBe(toVisible(g.run.state).netWorth);
});
it('leaves the lottery for the guaranteed money plan', () => {
  const g = leaveLottery(startGame(SEED, CONTENT), CONTENT);
  expect(g.screen).toEqual({ name: 'card' });
  expect(shownCard(g, CONTENT)?.id).toBe('money_plan');
});
it('shows the outcome before the year closes, keeping run.last', () => {
  let g = leaveLottery(startGame(SEED, CONTENT), CONTENT);
  const worth = toVisible(g.run.state).netWorth;
  g = pickChoice(g, CONTENT, 'half_index');
  expect(g.screen).toMatchObject({ name: 'outcome', before: { netWorth: worth } });
  expect(g.run.last?.choiceId).toBe('half_index');
  expect(g.run.state.history).toHaveLength(0);
  expect(shownCard(g, CONTENT)?.id).toBe('money_plan');
});
it('refuses actions on the wrong screen', () => {
  const g = startGame(SEED, CONTENT);
  expect(() => pickChoice(g, CONTENT, 'save_all')).toThrow('wrong screen');
  expect(() => leaveOutcome(g, CONTENT)).toThrow('wrong screen');
  expect(() => leaveRecap(g, CONTENT)).toThrow('wrong screen');
});
it('fast-forwards quiet years into one recap that stops before the next card or event', () => {
  const guaranteedOnly = CONTENT.filter((c) => c.triggers?.length);
  const g = playUntil(startGame(SEED, guaranteedOnly), guaranteedOnly,
    (x) => x.screen.name === 'recap' && x.screen.recap.toAge > x.screen.recap.fromAge);
  const { recap } = g.screen as Extract<Screen, { name: 'recap' }>;
  expect(recap.toAge).toBe(g.run.state.history.at(-1)!.age);
  expect(g.run.finished || g.run.queue.length > 0 || recap.event !== null).toBe(true);
});
it('plays a whole life, and the recaps add up to the net worth change', () => {
  const recaps: Recap[] = [];
  let g = startGame(SEED, CONTENT);
  while (g.screen.name !== 'report') {
    if (g.screen.name === 'recap') recaps.push(g.screen.recap);
    g = advance(g, CONTENT);
  }
  const s = g.run.state;
  expect(s.history).toHaveLength(END_AGE - s.start.startAge + 1);
  expect(recaps.at(-1)!.toAge).toBe(END_AGE);
  expect(recaps.reduce((sum, r) => sum + r.netWorthChange, 0)).toBe(toVisible(s).netWorth - g.startWorth);
});
it('names career changes between two years', () => {
  const c = makeState().career;
  expect(careerEvent(c, { ...c, level: c.level + 1 })).toBe('promoted');
  expect(careerEvent(c, { ...c, employed: false })).toBe('fired');
  expect(careerEvent({ ...c, employed: false }, c)).toBe('rehired');
  expect(careerEvent(c, c)).toBeNull();
});
