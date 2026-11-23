import { expect, it } from 'vitest';
import { CONTENT } from '../content';
import type { Card } from '../engine';
import { shownCard } from './flow';
import { SAVE_KEY, SAVE_VERSION, memoryStore, type KeyValueStore } from './save';
import { createAppStore, type StoreDeps } from './store';

const deps = (storage: KeyValueStore = memoryStore(), content: readonly Card[] = CONTENT): StoreDeps =>
  ({ content, storage, newSeed: () => 'store-demo' });

it('starts fresh, then saves a new run under the save key', () => {
  const storage = memoryStore();
  const store = createAppStore(deps(storage));
  const s = () => store.getState();
  expect(s().game).toBeNull();
  s().setNickname('  Raka  ');
  s().start();
  expect(s().game?.screen).toEqual({ name: 'lottery' });
  expect(s().game?.run.state.seed).toBe('store-demo');
  expect(s().nickname).toBe('Raka');
  expect(JSON.parse(storage.getItem(SAVE_KEY)!).v).toBe(SAVE_VERSION);
});
it('reopens the same outcome sheet after a refresh', () => {
  const storage = memoryStore();
  const a = createAppStore(deps(storage));
  a.getState().start(); a.getState().leaveLottery(); a.getState().pick('half_index');
  const b = createAppStore(deps(storage));
  expect(b.getState().game).toEqual(a.getState().game);
  expect(b.getState().game?.run.last?.choiceId).toBe('half_index');
});
it('ignores a second tap', () => {
  const store = createAppStore(deps());
  const s = () => store.getState();
  s().start(); s().leaveLottery(); s().pick('half_index'); s().pick('save_all');
  expect(s().game?.run.state.decisions).toHaveLength(1);
  expect(s().game?.run.last?.choiceId).toBe('half_index');
  s().leaveOutcome(); s().leaveOutcome();
  expect(s().game?.screen.name).toBe('card');
  expect(shownCard(s().game!, CONTENT)?.id).toBe('insurance_offer');
});
it('opens on the welcome screen and deletes a corrupt save', () => {
  const storage = memoryStore({ [SAVE_KEY]: '{"v":1,' });
  expect(createAppStore(deps(storage)).getState().game).toBeNull();
  expect(storage.getItem(SAVE_KEY)).toBeNull();
});
it('marks the run failed instead of throwing when a card breaks, and quit recovers', () => {
  const broken = CONTENT.map((c) => (c.id === 'money_plan'
    ? { ...c, choices: c.choices!.map((ch) => ({ ...ch, effect: () => { throw new Error('bad card'); } })) }
    : c));
  const store = createAppStore(deps(memoryStore(), broken));
  const s = () => store.getState();
  s().setLocale('jaksel'); s().start(); s().leaveLottery();
  expect(() => s().pick('save_all')).not.toThrow();
  expect(s().failed).toBe(true);
  expect(s().game?.screen.name).toBe('card');
  s().quit();
  expect(s()).toMatchObject({ game: null, failed: false, locale: 'jaksel' });
});
