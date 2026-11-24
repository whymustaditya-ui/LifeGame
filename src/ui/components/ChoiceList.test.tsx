import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ChoiceList } from './ChoiceList';

const OPTIONS = [
  { value: 'book', label: 'Gas, healing itu penting' },
  { value: 'bali', label: 'Bali aja deh', note: 'Rp6 jt' },
  { value: 'skip', label: 'Skip dulu, mau nabung' },
];
const setup = () => {
  const onConfirm = vi.fn();
  render(<ChoiceList legend="Pilihan lo" options={OPTIONS} confirmLabel="Pilih" onConfirm={onConfirm} />);
  return { onConfirm, user: userEvent.setup() };
};

it('styles every option the same and confirms once, only after a pick', async () => {
  const { onConfirm, user } = setup();
  const tiles = () => screen.getAllByRole('radio').map((r) => r.closest('label')!.className);
  expect(new Set(tiles()).size).toBe(1);
  const confirm = screen.getByRole('button', { name: 'Pilih' });
  expect(confirm).toBeDisabled();
  await user.click(screen.getByRole('radio', { name: /Bali aja deh/ }));
  expect(new Set(tiles()).size).toBe(1);
  await user.dblClick(confirm);
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledWith('bali');
});
it('works from the keyboard', async () => {
  const { onConfirm, user } = setup();
  screen.getByRole('radio', { name: /Skip dulu/ }).focus();
  await user.keyboard(' ');
  screen.getByRole('button', { name: 'Pilih' }).focus();
  await user.keyboard('{Enter}');
  expect(onConfirm).toHaveBeenCalledWith('skip');
});
