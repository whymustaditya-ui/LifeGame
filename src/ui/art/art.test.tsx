import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MotionRoot } from '../motion';
import { CoinFlip } from './CoinFlip';
import { Heart } from './Heart';
import { Oren, orenFor } from './Oren';

const EXPRESSIONS = ['curious', 'happy', 'shocked', 'tired', 'exhausted'] as const;
const LEVELS = ['seger', 'oke', 'capek', 'burnout'] as const;

it('draws a distinct face for each expression', () => {
  const faces = EXPRESSIONS.map((e) => {
    const { container, unmount } = render(<Oren expression={e} />);
    const html = container.querySelector('[data-face]')!.innerHTML;
    unmount();
    return html;
  });
  expect(new Set(faces).size).toBe(5);
});
it('maps feelings to expressions', () => {
  expect(LEVELS.map(orenFor)).toEqual(['happy', 'curious', 'tired', 'exhausted']);
});
it('cracks the heart further at each lower level', () => {
  const cracks = LEVELS.map((level) => {
    const { container, unmount } = render(<Heart level={level} />);
    const length = container.querySelector('[data-crack]')?.getAttribute('d')?.length ?? 0;
    unmount();
    return length;
  });
  expect(cracks[0]).toBe(0);
  expect(cracks[1]! > 0 && cracks[1]! < cracks[2]! && cracks[2]! < cracks[3]!).toBe(true);
});
it('lands the coin on the face it was given', () => {
  render(<MotionRoot><CoinFlip face="bad" /></MotionRoot>);
  expect(document.querySelector('[data-coin]')).toHaveAttribute('data-coin', 'bad');
});
