import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Card, Locale } from '../engine';
import * as flow from './flow';
import type { Game, Screen } from './flow';
import { cleanNickname, readSave, writeSave, type KeyValueStore } from './save';

export type Panel = 'wallet' | 'menu';

export interface AppState {
  content: readonly Card[]; locale: Locale; nickname: string;
  game: Game | null; panel: Panel | null; failed: boolean;
}

export interface AppActions {
  setLocale(locale: Locale): void; setNickname(raw: string): void;
  start(): void; leaveLottery(): void; pick(choiceId: string): void; leaveOutcome(): void; leaveRecap(): void;
  openPanel(panel: Panel): void; closePanel(): void; quit(): void;
}

export type AppStore = StoreApi<AppState & AppActions>;
export interface StoreDeps { content: readonly Card[]; storage: KeyValueStore; newSeed: () => string }

export function createAppStore(deps: StoreDeps): AppStore {
  const { content, storage } = deps;
  const saved = readSave(storage, content);

  const store = createStore<AppState & AppActions>()((set, get) => {
    /** Runs one flow step only on its own screen, so a stale second tap does nothing. */
    const step = (screen: Screen['name'], next: (game: Game) => Game): void => {
      const { game } = get();
      if (!game || game.screen.name !== screen) return;
      try {
        set({ game: next(game) });
      } catch {
        set({ failed: true });
      }
    };

    return {
      content,
      locale: saved?.locale ?? 'en',
      nickname: saved?.nickname ?? '',
      game: saved?.game ?? null,
      panel: null,
      failed: false,
      setLocale: (locale) => set({ locale }),
      setNickname: (raw) => set({ nickname: cleanNickname(raw) }),
      start: () => {
        if (get().game) return;
        try {
          set({ game: flow.startGame(deps.newSeed(), content), nickname: get().nickname.trim(), failed: false });
        } catch {
          set({ failed: true });
        }
      },
      leaveLottery: () => step('lottery', (g) => flow.leaveLottery(g, content)),
      pick: (choiceId) => step('card', (g) => flow.pickChoice(g, content, choiceId)),
      leaveOutcome: () => step('outcome', (g) => flow.leaveOutcome(g, content)),
      leaveRecap: () => step('recap', (g) => flow.leaveRecap(g, content)),
      openPanel: (panel) => set({ panel }),
      closePanel: () => set({ panel: null }),
      quit: () => set({ game: null, panel: null, failed: false }),
    };
  });

  store.subscribe((s, prev) => {
    if (s.game !== prev.game || s.locale !== prev.locale || s.nickname !== prev.nickname) {
      writeSave(storage, { locale: s.locale, nickname: s.nickname, game: s.game });
    }
  });
  return store;
}
