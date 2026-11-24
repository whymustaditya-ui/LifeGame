import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { atCard } from '../../app/test-utils';
import { CONTENT } from '../../content';
import { toVisible } from '../../engine';
import { formatMonths } from '../i18n/format';
import { renderWithStore } from '../test/render';
import { MenuPanel } from './MenuPanel';
import { WalletPanel } from './WalletPanel';

it('lists exact money, the emergency fund in months and the cover', () => {
  const game = atCard('wallet-demo', CONTENT, 'japan_trip',
    (s) => ({ ...s, fin: { ...s.fin, cash: 12_500_000, pinjol: 3_000_000, pinjolPrincipal: 3_000_000 } }));
  renderWithStore(<WalletPanel />, { game, locale: 'jaksel' });
  const dialog = within(screen.getByRole('dialog', { name: 'Dompet' }));
  expect(dialog.getByText('Rp12.500.000')).toBeInTheDocument();
  expect(dialog.getByText('Rp3.000.000')).toBeInTheDocument();
  expect(dialog.getByText('BPJS aja')).toBeInTheDocument();
  const months = formatMonths(toVisible(game.run.state).emergencyMonths, 'jaksel');
  expect(dialog.getByText(`${months} bulan biaya hidup`)).toBeInTheDocument();
});
it('switches language live and starts over', async () => {
  const { store, user } = renderWithStore(<MenuPanel />, { game: atCard('menu-demo', CONTENT, 'japan_trip') });
  await user.click(screen.getByRole('radio', { name: 'Jaksel' }));
  expect(store.getState().locale).toBe('jaksel');
  expect(screen.getByRole('dialog', { name: 'Pause dulu' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Mulai hidup baru' }));
  expect(store.getState().game).toBeNull();
});
