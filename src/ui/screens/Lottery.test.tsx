import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { startGame } from '../../app/flow';
import { CONTENT } from '../../content';
import { startLuckPercentile } from '../../engine';
import { rankBand } from '../i18n/format';
import { STRINGS } from '../i18n/strings';
import { renderWithStore } from '../test/render';
import { Lottery } from './Lottery';

it('reveals the four rolls, the first job age and how lucky the start was', () => {
  const game = startGame('lottery-demo', CONTENT);
  renderWithStore(<Lottery />, { game, locale: 'jaksel' });
  const start = game.run.state.start;
  const s = STRINGS.jaksel.lottery;
  for (const text of [
    s.familyValue[start.family], s.educationValue[start.education],
    start.supportsParents ? s.parentsValue.yes : s.parentsValue.no, s.temperamentValue[start.temperament],
    s.firstJob(start.startAge), s.luck(rankBand(startLuckPercentile(start.luckPoints))),
  ]) expect(screen.getByText(text)).toBeInTheDocument();
});
it('moves on to the first card', async () => {
  const { store, user } = renderWithStore(<Lottery />, { game: startGame('lottery-demo', CONTENT) });
  await user.click(screen.getByRole('button', { name: 'Get to work' }));
  expect(store.getState().game?.screen.name).toBe('card');
});
