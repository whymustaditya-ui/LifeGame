import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { SAVE_KEY, memoryStore } from '../app/save';
import { atCard } from '../app/test-utils';
import { CONTENT } from '../content';
import { App } from './App';
import { STRINGS, type Strings } from './i18n/strings';
import { renderWithStore } from './test/render';

/** One player action: pick the first option and confirm, or press the last button on screen. */
async function step(user: UserEvent, s: Strings): Promise<void> {
  const choose = screen.queryByRole('button', { name: s.card.choose });
  if (choose) {
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(choose);
    return;
  }
  await user.click(screen.getAllByRole('button').at(-1)!);
}

it.each(['en', 'jaksel'] as const)('plays a whole life in %s and starts another', async (locale) => {
  const s = STRINGS[locale];
  const { user } = renderWithStore(<App />, { locale, seed: 'app-life' });
  for (let i = 0; i < 800 && !screen.queryByRole('heading', { name: s.report.done }); i++) await step(user, s);
  expect(screen.getByRole('heading', { name: s.report.done })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: s.report.again }));
  expect(screen.getByRole('button', { name: s.welcome.start })).toBeInTheDocument();
}, 60_000);

it('reopens the same outcome sheet after a refresh', async () => {
  const storage = memoryStore();
  const first = renderWithStore(<App />, { storage, seed: 'app-refresh' });
  for (let i = 0; i < 3; i++) await step(first.user, STRINGS.en);
  expect(screen.getByText('Everything goes to savings. Boring, safe.')).toBeInTheDocument();
  first.unmount();
  renderWithStore(<App />, { storage, seed: 'unused' });
  expect(screen.getByText('Everything goes to savings. Boring, safe.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
});

it('opens on the welcome screen over a corrupt save', () => {
  renderWithStore(<App />, { storage: memoryStore({ [SAVE_KEY]: '{"v":1,"locale":' }) });
  expect(screen.getByRole('button', { name: 'Start my life' })).toBeInTheDocument();
});

it('switches every visible string mid-run from the menu and saves the choice', async () => {
  const storage = memoryStore();
  const { user } = renderWithStore(<App />, { storage, game: atCard('app-lang', CONTENT, 'japan_trip') });
  await user.click(screen.getByRole('button', { name: 'Menu' }));
  await user.click(screen.getByRole('radio', { name: 'Jaksel' }));
  await user.click(screen.getByRole('button', { name: 'Lanjut main' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('Grup chat udah mau booking Jepang buat April. Rp18 jt per orang. Lo ikut gak?')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pilih' })).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('id');
  expect(JSON.parse(storage.getItem(SAVE_KEY)!).locale).toBe('jaksel');
});

it('answers a card and works the wallet with the keyboard alone', async () => {
  const { user } = renderWithStore(<App />, { game: atCard('app-keys', CONTENT, 'japan_trip') });
  screen.getByRole('radio', { name: /Go to Bali instead/ }).focus();
  await user.keyboard(' ');
  screen.getByRole('button', { name: 'Choose' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  const pill = screen.getByRole('button', { name: /Open wallet/ });
  pill.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('dialog', { name: 'Wallet' })).toBeInTheDocument();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(pill).toHaveFocus();
});

it('shows the error screen when a card breaks, then starts over', async () => {
  const broken = CONTENT.map((c) => (c.id === 'japan_trip'
    ? { ...c, choices: c.choices!.map((ch) => ({ ...ch, effect: () => { throw new Error('bad card'); } })) }
    : c));
  const { user } = renderWithStore(<App />, { content: broken, game: atCard('app-error', broken, 'japan_trip') });
  await user.click(screen.getByRole('radio', { name: /Go to Bali instead/ }));
  await user.click(screen.getByRole('button', { name: 'Choose' }));
  expect(screen.getByRole('heading', { name: 'Something broke.' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Start a new life' }));
  expect(screen.getByRole('button', { name: 'Start my life' })).toBeInTheDocument();
});
