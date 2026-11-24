import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import type { Game } from '../../app/flow';
import { memoryStore, type KeyValueStore } from '../../app/save';
import { createAppStore, type AppStore } from '../../app/store';
import { CONTENT } from '../../content';
import type { Card, Locale } from '../../engine';
import { MotionRoot } from '../motion';
import { AppStoreProvider } from '../store';

interface Options { game?: Game; locale?: Locale; content?: readonly Card[]; storage?: KeyValueStore; seed?: string }

/** Renders UI inside a real store (in-memory storage, sample content) and the app's Motion setup. */
export function renderWithStore(ui: ReactElement, options: Options = {}): RenderResult & { store: AppStore; user: UserEvent } {
  const store = createAppStore({
    content: options.content ?? CONTENT,
    storage: options.storage ?? memoryStore(),
    newSeed: () => options.seed ?? 'ui-test',
  });
  if (options.game) store.setState({ game: options.game });
  if (options.locale) store.setState({ locale: options.locale });
  const user = userEvent.setup();
  const result = render(<AppStoreProvider store={store}><MotionRoot>{ui}</MotionRoot></AppStoreProvider>);
  return { ...result, store, user };
}
