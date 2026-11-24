import { expect, it } from 'vitest';
import { toVisible, type ChoiceResult, type VisibleState } from '../../engine';
import { makeState } from '../../engine/test-utils';
import { describeOutcome } from './describe';

const v = (over: Partial<VisibleState>): VisibleState => ({ ...toVisible(makeState()), ...over });
const NO_DEBT = { kpr: 0, pinjol: 0, cardDebt: 0 };
const kopiMiss: ChoiceResult = {
  cardId: 'kopi_bet', choiceId: 'invest', score: 4, roll: { hit: false, luck: -10, expected: 0.5 },
  message: { en: 'The shop closed after 8 months.', jaksel: 'Kedainya tutup setelah 8 bulan.' },
};

it('matches the mockup: a sensible bet that went rugi', () => {
  expect(describeOutcome({
    before: v({ netWorth: 120_000_000, emergencyMonths: 6, debt: NO_DEBT, married: false, children: 0 }),
    after: v({ netWorth: 110_000_000 }), result: kopiMiss, locale: 'jaksel',
  })).toEqual({
    tone: 'bad', coin: 'bad', headline: 'Rugi, -Rp10 jt', message: 'Kedainya tutup setelah 8 bulan.',
    grade: { score: 4, label: 'Keputusan lo: masuk akal', situation: 'Waktu itu: dana darurat 6 bulan, bebas pinjol.' },
    luckLine: 'Yang ini apes, bukan salah lo.',
  });
});
it('calls a lucky break on a shaky bet', () => {
  const view = describeOutcome({
    before: v({ netWorth: 100_000_000, debt: NO_DEBT }), after: v({ netWorth: 115_000_000 }),
    result: { ...kopiMiss, score: 2, roll: { hit: true, luck: 20, expected: 0.5 } }, locale: 'en',
  });
  expect(view).toMatchObject({ tone: 'good', coin: 'good', headline: 'Gain, +Rp15M', luckLine: 'Lucky this time.' });
  expect(view.grade?.label).toBe('Your call: shaky');
});
it('uses the quiet headline when luck moved no money', () => {
  const clear: ChoiceResult = { cardId: 'health_check', choiceId: 'ok', score: null, roll: { hit: false, luck: 5, expected: 0.5 }, message: null };
  expect(describeOutcome({ before: v({}), after: v({}), result: clear, locale: 'en' }))
    .toMatchObject({ tone: 'good', headline: 'All good', grade: null, luckLine: 'A lucky break.' });
});
it('keeps a choice without a roll neutral', () => {
  const book: ChoiceResult = { cardId: 'japan_trip', choiceId: 'book', score: 1, roll: null, message: null };
  expect(describeOutcome({ before: v({ netWorth: 50_000_000 }), after: v({ netWorth: 32_000_000 }), result: book, locale: 'en' }))
    .toMatchObject({ tone: 'neutral', coin: null, headline: '-Rp18M', luckLine: null });
});
it('mentions pinjol and family when they were on the table', () => {
  const view = describeOutcome({
    before: v({ emergencyMonths: 0.5, debt: { kpr: 0, pinjol: 3_000_000, cardDebt: 0 }, married: true }),
    after: v({}), result: { ...kopiMiss, score: 3 }, locale: 'en',
  });
  expect(view.grade?.situation).toBe('At the time: 0.5 months saved, pinjol still open, a family to cover.');
});
