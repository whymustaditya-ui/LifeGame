import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { startGame, type Game, type Recap } from '../../app/flow';
import { CONTENT } from '../../content';
import { renderWithStore } from '../test/render';
import { RecapScreen } from './RecapScreen';

const recapGame = (over: Partial<Recap>, finished = false): Game => {
  const g = startGame('recap-demo', CONTENT);
  const recap: Recap = { fromAge: 27, toAge: 27, netWorth: 42_000_000, netWorthChange: 12_000_000, employed: true,
    titleKey: 'degree_1', monthlyIncome: 9_200_000, level: 'capek', event: 'promoted', ...over };
  return { ...g, run: { ...g.run, finished }, screen: { name: 'recap', recap } };
};

// The top bar shows the run's own feeling (Okay at the start), so the recap uses Tired to stay unambiguous.
it('recaps one year with the job, income, net worth and feeling', () => {
  renderWithStore(<RecapScreen />, { game: recapGame({}) });
  expect(screen.getByRole('heading', { level: 1, name: 'Age 27, done.' })).toBeInTheDocument();
  for (const text of ['Promoted.', 'Associate', 'Rp9,200,000 a month', 'Rp42,000,000', '+Rp12M this year', 'Tired'])
    expect(screen.getByText(text)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next year' })).toBeInTheDocument();
});
it('fast-forwards quiet years under one title', () => {
  renderWithStore(<RecapScreen />, { game: recapGame({ fromAge: 31, toAge: 34, event: null, employed: false, netWorthChange: -3_000_000 }), locale: 'jaksel' });
  for (const text of ['Umur 31 sampai 34 kelar.', 'Tahun-tahun yang tenang. Hidup jalan terus.', 'Lagi nganggur', '-Rp3 jt dalam 4 tahun'])
    expect(screen.getByText(text)).toBeInTheDocument();
  expect(screen.queryByText('Gaji')).not.toBeInTheDocument();
});
it('offers the report after the last year', async () => {
  const { store, user } = renderWithStore(<RecapScreen />, { game: recapGame({ fromAge: 60, toAge: 60, event: null }, true) });
  await user.click(screen.getByRole('button', { name: 'See my life' }));
  expect(store.getState().game?.screen.name).toBe('report');
});
