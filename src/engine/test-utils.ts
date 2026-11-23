import { initialState } from './state';
import type { GameState, StartProfile } from './types';

/** Freezes a value recursively so any mutation inside the engine throws in strict mode. */
export function deepFreeze<T>(x: T): T {
  if (x !== null && typeof x === 'object' && !Object.isFrozen(x)) {
    Object.freeze(x);
    for (const v of Object.values(x as Record<string, unknown>)) deepFreeze(v);
  }
  return x;
}

const FIXTURE_START: StartProfile = {
  family: 'middle', education: 'degree', supportsParents: false, temperament: 'steady', startAge: 22, luckPoints: 15,
};

export function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...initialState('fixture', FIXTURE_START), ...overrides };
}
