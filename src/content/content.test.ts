import { describe, it, expect } from 'vitest';
import { validateContent } from '../engine/content-check';
import { makeState } from '../engine/test-utils';
import { toVisible } from '../engine/visible';
import { SAMPLE_CARDS } from './sample';

describe('content validation and sample cards', () => {
  it('accepts the sample cards', () => expect(validateContent(SAMPLE_CARDS)).toEqual([]));
  it('flags missing Jaksel copy with the card id', () => {
    const broken = SAMPLE_CARDS.map((c) => (c.id === 'japan_trip' ? { ...c, copy: { ...c.copy, jaksel: '' } } : c));
    expect(validateContent(broken).join('\n')).toContain('japan_trip');
  });
  it('flags duplicate ids and em dashes', () => {
    const dup = [...SAMPLE_CARDS, SAMPLE_CARDS[0]!];
    expect(validateContent(dup).length).toBeGreaterThan(0);
    const dash = SAMPLE_CARDS.map((c) => (c.id === 'friend_car' ? { ...c, copy: { ...c.copy, en: `New car ${String.fromCharCode(0x2014)} again` } } : c));
    expect(validateContent(dash).join('\n')).toContain('friend_car');
  });
  it('flags an uncovered trigger', () => {
    expect(validateContent(SAMPLE_CARDS.filter((c) => c.id !== 'recovery')).join('\n')).toContain('capek');
  });
  it('grades the Japan trip by emergency months', () => {
    const japan = SAMPLE_CARDS.find((c) => c.id === 'japan_trip')!;
    const v = { ...toVisible(makeState()), emergencyMonths: 4, debt: { kpr: 0, pinjol: 0, cardDebt: 0 } };
    expect(japan.choices!.map((ch) => ch.grade!(v))).toEqual([2, 5, 4]);
  });
});
