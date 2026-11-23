import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { MotionRoot } from '../motion';
import { Sheet } from './Sheet';

function Harness() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && <Sheet title="Dompet" closeLabel="Tutup" onClose={() => setIsOpen(false)}><p>isi</p></Sheet>}
    </>
  );
}

it('is a labelled dialog that takes focus, closes on Escape and returns focus', async () => {
  const user = userEvent.setup();
  render(<MotionRoot><Harness /></MotionRoot>);
  await user.click(screen.getByRole('button', { name: 'Open' }));
  expect(screen.getByRole('dialog', { name: 'Dompet' })).toContainElement(document.activeElement as HTMLElement);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
});
