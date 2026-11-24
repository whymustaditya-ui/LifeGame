import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { AppActions, AppState, AppStore } from '../app/store';
import type { Locale } from '../engine';
import { STRINGS, type Strings } from './i18n/strings';

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ store, children }: { store: AppStore; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** Select single fields only: Zustand v5 loops when a selector returns a new object. */
export function useApp<T>(selector: (s: AppState & AppActions) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useApp: wrap the app in AppStoreProvider');
  return useStore(store, selector);
}

export function useLocale(): Locale {
  return useApp((s) => s.locale);
}

export function useStrings(): Strings {
  return STRINGS[useLocale()];
}
