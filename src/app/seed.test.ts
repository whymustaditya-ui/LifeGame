import { expect, it } from 'vitest';
import { newSeed } from './seed';

it('makes ten-character seeds from an unambiguous alphabet', () => {
  expect(newSeed()).toMatch(/^[a-km-np-z2-9]{10}$/);
  expect(newSeed()).not.toBe(newSeed());
});
it('maps bytes to the alphabet', () => {
  expect(newSeed((b) => b.fill(0))).toBe('aaaaaaaaaa');
  expect(newSeed((b) => b.fill(255))).toBe('9999999999');
});
