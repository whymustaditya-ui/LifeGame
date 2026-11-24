import { expect, it } from 'vitest';
import { browserStore } from './storage';

it('uses localStorage when it works and memory when it throws', () => {
  browserStore().setItem('k', 'v');
  expect(localStorage.getItem('k')).toBe('v');
  const fallback = browserStore(() => { throw new Error('denied'); });
  fallback.setItem('k', 'w');
  expect(fallback.getItem('k')).toBe('w');
});
