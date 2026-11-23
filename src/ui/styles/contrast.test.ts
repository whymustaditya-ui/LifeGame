import { expect, it } from 'vitest';
import tokens from './tokens.css?raw';

const hex = (name: string): string => {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9A-F]{6})`));
  if (!m?.[1]) throw new Error(`missing token ${name}`);
  return m[1];
};
const luminance = (h: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(hex(a)), luminance(hex(b))].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

it.each([
  ['ink', 'paper', 4.5], ['muted-text', 'paper', 4.5], ['ink', 'pandan', 4.5], ['paper', 'sambal-d', 4.5],
  ['telang-d', 'paper', 4.5], ['ink', 'telang-bg', 4.5], ['ink', 'sambal-bg', 4.5], ['ink', 'pandan-bg', 4.5],
  ['ink', 'kunyit', 4.5], ['paper', 'ubi-d', 4.5], ['ubi-d', 'sambal-bg', 4.5], ['ubi-d', 'pandan-bg', 4.5],
  ['sambal-d', 'sambal-bg', 3], ['pandan-d', 'pandan-bg', 3], ['kunyit-text', 'paper', 3], ['pandan-d', 'paper', 3],
  ['muted', 'paper', 3], ['sambal', 'paper', 3],
] as const)('%s on %s reaches %s:1', (fg, bg, min) => {
  expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
});
it('keeps the spec palette exact', () => {
  expect(['pandan', 'pandan-d', 'telang', 'telang-d', 'telang-bg', 'sambal', 'sambal-d', 'sambal-bg', 'kunyit', 'kunyit-d', 'ubi', 'ubi-d', 'ink', 'muted', 'line', 'paper'].map(hex))
    .toEqual(['#3CC46B', '#2A9A51', '#1E9BF0', '#1478C2', '#DDF1FF', '#FF4D4F', '#D93A3C', '#FFE5E5', '#FFC21A', '#E0A100', '#A46BF5', '#7E4BD1', '#2F3B45', '#77838C', '#E3E7EA', '#FFFFFF']);
});
