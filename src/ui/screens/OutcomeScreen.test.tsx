import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { pickChoice } from '../../app/flow';
import { atCard } from '../../app/test-utils';
import { CONTENT } from '../../content';
import { rollStart } from '../../engine';
import { draw, keyOf } from '../../engine/rng';
import { findSeed } from '../../engine/test-utils';
import { renderWithStore } from '../test/render';
import { OutcomeScreen } from './OutcomeScreen';

it('plays the mockup moment end to end', async () => {
  const seed = findSeed((x) => draw(x, keyOf(rollStart(x).startAge, 'outcome', 'kopi_bet')) >= 0.35);
  const parked = atCard(seed, CONTENT, 'kopi_bet', (s) => ({ ...s, fin: { ...s.fin, cash: 120_000_000 } }));
  const game = pickChoice(parked, CONTENT, 'invest');
  const { store, user } = renderWithStore(<OutcomeScreen />, { game, locale: 'jaksel' });
  const heading = screen.getByRole('heading', { level: 2, name: 'Rugi, -Rp10 jt' });
  expect(heading).toHaveFocus();
  for (const text of ['Kedainya tutup setelah 8 bulan.', 'Keputusan lo: masuk akal', 'Yang ini apes, bukan salah lo.'])
    expect(screen.getByText(text)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Lanjut' }));
  expect(store.getState().game?.screen.name).not.toBe('outcome');
});
