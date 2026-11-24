import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { atCard } from '../../app/test-utils';
import { CONTENT } from '../../content';
import { renderWithStore } from '../test/render';
import { TopBar } from './TopBar';

it('shows the feeling as a word, never a number', () => {
  const game = atCard('bar-demo', CONTENT, 'japan_trip', (s) => ({ ...s, wellbeing: 30 }));
  renderWithStore(<TopBar />, { game, locale: 'jaksel' });
  const feeling = screen.getByLabelText('Kondisi lo: Capek');
  expect(feeling).toHaveTextContent('Capek');
  expect(feeling.textContent).not.toMatch(/\d/);
});
it('tracks age and opens the wallet and the menu', async () => {
  const game = atCard('bar-demo', CONTENT, 'japan_trip', (s) => ({ ...s, fin: { ...s.fin, cash: 42_000_000 } }));
  const { store, user } = renderWithStore(<TopBar />, { game });
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(game.run.state.age));
  await user.click(screen.getByRole('button', { name: 'Net worth Rp42M. Open wallet' }));
  expect(store.getState().panel).toBe('wallet');
  await user.click(screen.getByRole('button', { name: 'Menu' }));
  expect(store.getState().panel).toBe('menu');
});
