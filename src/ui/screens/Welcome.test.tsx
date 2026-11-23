import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderWithStore } from '../test/render';
import { Welcome } from './Welcome';

it('switches its copy when Jaksel is picked', async () => {
  const { user } = renderWithStore(<Welcome />);
  expect(screen.getByRole('button', { name: 'Start my life' })).toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: 'Jaksel' }));
  expect(screen.getByRole('button', { name: 'Mulai hidup' })).toBeInTheDocument();
});
it('starts a run with a trimmed nickname', async () => {
  const { store, user } = renderWithStore(<Welcome />);
  await user.type(screen.getByLabelText('Nickname (optional)'), '  Raka  ');
  await user.click(screen.getByRole('button', { name: 'Start my life' }));
  expect(store.getState().nickname).toBe('Raka');
  expect(store.getState().game?.screen.name).toBe('lottery');
});
it('caps the nickname at 20 characters', async () => {
  const { user } = renderWithStore(<Welcome />);
  const input = screen.getByLabelText('Nickname (optional)');
  await user.type(input, 'x'.repeat(30));
  expect(input).toHaveValue('x'.repeat(20));
});
