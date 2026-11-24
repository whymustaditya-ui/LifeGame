import { render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MotionRoot } from './motion';
import { useCountUp } from './use-count-up';

function Probe({ n }: { n: number }) {
  return <output>{useCountUp(n)}</output>;
}

it('lands on the new value', async () => {
  const { rerender } = render(<MotionRoot><Probe n={10} /></MotionRoot>);
  expect(screen.getByRole('status')).toHaveTextContent('10');
  rerender(<MotionRoot><Probe n={500} /></MotionRoot>);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('500'));
});
