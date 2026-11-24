import { expect, it } from 'vitest';
import { STRINGS } from './strings';

const leaves = (x: unknown): string[] =>
  typeof x === 'string' || typeof x === 'function' ? [String(x)]
    : Object.values(x as Record<string, unknown>).flatMap(leaves);

it.each(['en', 'jaksel'] as const)('keeps the %s copy clean', (locale) => {
  for (const text of leaves(STRINGS[locale])) {
    expect(text).not.toContain(String.fromCharCode(0x2014));
    expect(text).not.toContain('--');
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  }
});
it('interpolates like the mockup', () => {
  expect(STRINGS.jaksel.card.title.dilemma(27)).toBe('Umur 27. Pilih langkah lo.');
  expect(STRINGS.jaksel.outcome.loss('-Rp10 jt')).toBe('Rugi, -Rp10 jt');
  expect(STRINGS.jaksel.outcome.yourCall(STRINGS.jaksel.outcome.score[4])).toBe('Keputusan lo: masuk akal');
  expect(STRINGS.en.outcome.situation('0.5', true, true)).toBe('At the time: 0.5 months saved, pinjol still open, a family to cover.');
  expect(STRINGS.jaksel.outcome.situation('6', false, false)).toBe('Waktu itu: dana darurat 6 bulan, bebas pinjol.');
  expect(STRINGS.en.recap.change('+Rp12M', 1)).toBe('+Rp12M this year');
  expect(STRINGS.jaksel.recap.change('-Rp3 jt', 4)).toBe('-Rp3 jt dalam 4 tahun');
  expect(STRINGS.en.feeling.burnout).toBe('Burnt out');
});
