import { useMemo } from 'react';

/**
 * How long a freshly shown screen ignores taps. A double tap on Next would otherwise land its second tap on the
 * next card's button, which sits in the same spot, and answer that card unseen. Tests set ms to 0.
 */
export const TAP_GUARD = { ms: 300 };

/** Wraps a handler so it ignores activations within TAP_GUARD.ms of `screen` changing. */
export function useTapGuard(screen: unknown): (action: () => void) => () => void {
  const shownAt = useMemo(() => performance.now(), [screen]);
  return (action) => () => {
    if (performance.now() - shownAt < TAP_GUARD.ms) return;
    action();
  };
}
