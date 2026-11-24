import { memoryStore, type KeyValueStore } from '../app/save';

const PROBE_KEY = 'lifeworth.probe';

/** localStorage when it works; memory otherwise (Safari private mode, blocked storage), so the game still plays. */
export function browserStore(get: () => Storage = () => window.localStorage): KeyValueStore {
  try {
    const storage = get();
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return memoryStore();
  }
}
