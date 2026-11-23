import { expect, it } from 'vitest';
import { CONTENT } from '../content';
import { startGame, type Game, type Screen } from './flow';
import {
  SAVE_KEY, decodeSave, encodeSave, memoryStore, readSave, writeSave, type KeyValueStore, type Saved,
} from './save';
import { playUntil } from './test-utils';

const SEED = 'save-demo';
const at = (name: Screen['name']): Game => playUntil(startGame(SEED, CONTENT), CONTENT, (g) => g.screen.name === name);

it('round-trips every screen', () => {
  for (const name of ['lottery', 'card', 'outcome', 'recap', 'report'] as const) {
    const saved: Saved = { locale: 'jaksel', nickname: 'Raka', game: at(name) };
    expect(decodeSave(encodeSave(saved), CONTENT)).toEqual(saved);
  }
});
it('rejects anything it cannot trust', () => {
  const good = JSON.parse(encodeSave({ locale: 'en', nickname: '', game: at('card') }));
  const bad = [
    '{"v":1,"locale":"en"',
    JSON.stringify({ ...good, v: 0 }),
    JSON.stringify({ ...good, locale: 'fr' }),
    JSON.stringify({ ...good, game: { ...good.game, run: '{}' } }),
    JSON.stringify({ ...good, game: { ...good.game, screen: { name: 'outcome', before: null } } }),
    JSON.stringify({ ...good, game: { ...good.game, screen: { name: 'report' } } }),
  ];
  for (const raw of bad) expect(decodeSave(raw, CONTENT)).toBeNull();
});
it('rejects a save whose queued card no longer exists', () => {
  const raw = encodeSave({ locale: 'en', nickname: '', game: at('card') });
  expect(decodeSave(raw, CONTENT.filter((c) => c.id !== 'money_plan'))).toBeNull();
});
it('cleans the nickname on load', () => {
  const raw = encodeSave({ locale: 'en', nickname: `Raka\u0007${'x'.repeat(30)}`, game: null });
  expect(decodeSave(raw, CONTENT)?.nickname).toBe(`Raka${'x'.repeat(16)}`);
});
it('deletes an unreadable save and never throws on a broken store', () => {
  const store = memoryStore({ [SAVE_KEY]: 'not json' });
  expect(readSave(store, CONTENT)).toBeNull();
  expect(store.getItem(SAVE_KEY)).toBeNull();
  const fail = (): never => { throw new Error('denied'); };
  const broken: KeyValueStore = { getItem: fail, setItem: fail, removeItem: fail };
  expect(readSave(broken, CONTENT)).toBeNull();
  expect(() => writeSave(broken, { locale: 'en', nickname: '', game: null })).not.toThrow();
});
