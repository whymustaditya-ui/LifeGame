import { render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { expect, it } from 'vitest';
import { MotionRoot } from '../motion';

it('renders into jsdom with jest-dom matchers and instant motion', () => {
  render(<MotionRoot><button type="button">Mulai</button></MotionRoot>);
  expect(screen.getByRole('button', { name: 'Mulai' })).toBeInTheDocument();
  expect(MotionGlobalConfig.skipAnimations).toBe(true);
  expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
});
