import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach } from 'vitest';
import { TAP_GUARD } from '../tap-guard';

MotionGlobalConfig.skipAnimations = true;
// Tests click faster than any thumb; the double-tap test turns the guard back on.
TAP_GUARD.ms = 0;

// jsdom has no matchMedia; Motion's reduced-motion check reads it.
window.matchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
});

// Vitest globals are off, so Testing Library cannot register its own cleanup.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
