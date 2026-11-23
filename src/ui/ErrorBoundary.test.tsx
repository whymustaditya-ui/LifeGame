import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

it('catches a render error, shows the fallback and recovers on reset', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  let explode = true;
  function Bomb() {
    if (explode) throw new Error('boom');
    return <p>fine</p>;
  }
  const onReset = vi.fn(() => { explode = false; });
  const user = userEvent.setup();
  render(
    <ErrorBoundary onReset={onReset} fallback={(reset) => <button type="button" onClick={reset}>Reset</button>}>
      <Bomb />
    </ErrorBoundary>,
  );
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(onReset).toHaveBeenCalledTimes(1);
  expect(screen.getByText('fine')).toBeInTheDocument();
});
