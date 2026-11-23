import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { atCard } from '../../app/test-utils';
import { CONTENT } from '../../content';
import { renderWithStore } from '../test/render';
import { CardScreen } from './CardScreen';

it('renders a Jaksel dilemma with its phone moment and identical choices', async () => {
  const game = atCard('card-demo', CONTENT, 'japan_trip');
  const { store, user } = renderWithStore(<CardScreen />, { game, locale: 'jaksel' });
  expect(screen.getByRole('heading', { level: 1, name: `Umur ${game.run.state.age}. Pilih langkah lo.` })).toBeInTheDocument();
  expect(screen.getByText('dindaaa.r')).toBeInTheDocument();
  expect(screen.getByText('upload story dari Kyoto')).toBeInTheDocument();
  expect(screen.getByText('Grup chat udah mau booking Jepang buat April. Rp18 jt per orang. Lo ikut gak?')).toBeInTheDocument();
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  await user.click(screen.getByRole('radio', { name: /Bali aja deh/ }));
  await user.click(screen.getByRole('button', { name: 'Pilih' }));
  expect(store.getState().game?.screen.name).toBe('outcome');
  expect(store.getState().game?.run.last?.choiceId).toBe('bali');
});
it('gives a luck card one button', async () => {
  const { store, user } = renderWithStore(<CardScreen />, { game: atCard('card-demo', CONTENT, 'health_check') });
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'See what happens' }));
  expect(store.getState().game?.run.last?.choiceId).toBe('ok');
});
it('gives a one-choice feed card one button', () => {
  renderWithStore(<CardScreen />, { game: atCard('card-demo', CONTENT, 'friend_car') });
  expect(screen.getByRole('button', { name: 'Keep scrolling' })).toBeInTheDocument();
});
it('warns when tired and stays quiet when okay', () => {
  const tired = renderWithStore(<CardScreen />, { game: atCard('card-demo', CONTENT, 'japan_trip', (s) => ({ ...s, wellbeing: 30 })) });
  expect(screen.getByText('Running on fumes lately.')).toBeInTheDocument();
  tired.unmount();
  renderWithStore(<CardScreen />, { game: atCard('card-demo', CONTENT, 'japan_trip', (s) => ({ ...s, wellbeing: 60 })) });
  expect(screen.queryByText('Running on fumes lately.')).not.toBeInTheDocument();
});
