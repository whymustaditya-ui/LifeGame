import { deserialize, serialize } from '../engine';
import type { Card, Locale, Run } from '../engine';
import type { Game, Screen } from './flow';

export const SAVE_KEY = 'lifeworth.save';
export const SAVE_VERSION = 1;
export const NICKNAME_MAX = 20;

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Saved { locale: Locale; nickname: string; game: Game | null }

type Json = Record<string, unknown>;
const isObject = (x: unknown): x is Json => typeof x === 'object' && x !== null;
const isNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/** Removes control characters and cuts to NICKNAME_MAX. Trimming happens when a run starts. */
export function cleanNickname(raw: string): string {
  return raw.replace(CONTROL_CHARS, '').slice(0, NICKNAME_MAX);
}

export function encodeSave(saved: Saved): string {
  const game = saved.game && { run: serialize(saved.game.run), screen: saved.game.screen, startWorth: saved.game.startWorth };
  return JSON.stringify({ v: SAVE_VERSION, locale: saved.locale, nickname: saved.nickname, game });
}

function screenFits(screen: unknown, run: Run): screen is Screen {
  if (!isObject(screen)) return false;
  switch (screen.name) {
    case 'lottery': return !run.finished;
    case 'card': return !run.finished && run.queue.length > 0;
    case 'outcome': return run.last !== null && isObject(screen.before) && isNumber(screen.before.netWorth);
    case 'recap': {
      const r = screen.recap;
      return isObject(r) && isNumber(r.fromAge) && isNumber(r.toAge) && isNumber(r.netWorth) && isNumber(r.netWorthChange);
    }
    case 'report': return run.finished;
    default: return false;
  }
}

function decodeGame(raw: unknown, content: readonly Card[]): Game | null {
  if (!isObject(raw) || typeof raw.run !== 'string' || !isNumber(raw.startWorth)) return null;
  const run = deserialize(raw.run);
  const ids = new Set(content.map((c) => c.id));
  const known = run.queue.every((id) => ids.has(id)) && (run.last === null || ids.has(run.last.cardId));
  if (!known || !screenFits(raw.screen, run)) return null;
  return { run, screen: raw.screen, startWorth: raw.startWorth };
}

/** Restores a save, or null for anything that cannot be trusted, so a bad save never half-loads. */
export function decodeSave(raw: string, content: readonly Card[]): Saved | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isObject(data) || data.v !== SAVE_VERSION) return null;
    if (data.locale !== 'en' && data.locale !== 'jaksel') return null;
    if (typeof data.nickname !== 'string') return null;
    const game = data.game === null ? null : decodeGame(data.game, content);
    if (data.game !== null && game === null) return null;
    return { locale: data.locale, nickname: cleanNickname(data.nickname), game };
  } catch {
    return null;
  }
}

/** Never throws. Deletes a stored value it cannot decode. */
export function readSave(store: KeyValueStore, content: readonly Card[]): Saved | null {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (raw === null) return null;
    const saved = decodeSave(raw, content);
    if (saved === null) store.removeItem(SAVE_KEY);
    return saved;
  } catch {
    return null;
  }
}

/** Never throws: a full or blocked storage only means no autosave. */
export function writeSave(store: KeyValueStore, saved: Saved): void {
  try {
    store.setItem(SAVE_KEY, encodeSave(saved));
  } catch {
    // Storage is optional; the game keeps running without it.
  }
}

export function memoryStore(initial: Readonly<Record<string, string>> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: (key) => { data.delete(key); },
  };
}
