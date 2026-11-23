import { describe, it, expect } from 'vitest';
import { archetypeOf } from './archetype';
import { letterOf } from './grading';
import { percentileOf } from './percentile';
import { buildReport, luckScore } from './report';
import { deepFreeze, makeState } from './test-utils';

const identity = Array.from({ length: 101 }, (_, i) => i);

describe('grades, percentiles, archetypes and the report', () => {
  it('converts averages to letters', () => {
    expect([4.6, 4.59, 3.7, 1.59].map((x) => letterOf(x))).toEqual(['A', 'A-', 'B', 'E']);
    expect(letterOf(null)).toBe('C');
  });
  it('interpolates percentiles and clamps the ends', () => {
    expect(percentileOf(37.5, identity)).toBe(38);
    expect(percentileOf(-5, identity)).toBe(0);
    expect(percentileOf(200, identity)).toBe(100);
  });
  it('sums luck against expectation', () => {
    expect(luckScore([{ age: 30, source: 'a', expected: 3.6, actual: 20 }, { age: 31, source: 'b', expected: -10, actual: -40 }])).toBeCloseTo(-13.6);
  });
  it('picks archetypes in priority order', () => {
    const base = { burnoutYears: 0, netWorthPct: 50, avgWellbeing: 50, luckPct: 50, gradeAvg: 3.0, supportsParents: false };
    expect(archetypeOf({ ...base, burnoutYears: 6, netWorthPct: 90 })).toBe('burnt_out');
    expect(archetypeOf({ ...base, netWorthPct: 75, avgWellbeing: 40 })).toBe('rich_but_tired');
    expect(archetypeOf({ ...base, luckPct: 85, gradeAvg: 2.9 })).toBe('lucky_gambler');
    expect(archetypeOf({ ...base, luckPct: 10, gradeAvg: 3.9 })).toBe('unlucky_but_wise');
    expect(archetypeOf({ ...base, gradeAvg: 3.8, netWorthPct: 60, avgWellbeing: 55 })).toBe('steady_compounder');
    expect(archetypeOf({ ...base, netWorthPct: 20, avgWellbeing: 65 })).toBe('broke_but_happy');
    expect(archetypeOf({ ...base, supportsParents: true, gradeAvg: 3.5, netWorthPct: 40 })).toBe('sandwich_hero');
    expect(archetypeOf({ ...base, avgWellbeing: 58, netWorthPct: 35 })).toBe('balanced');
    expect(archetypeOf(base)).toBe('getting_by');
  });
  it('builds a report from a finished state', () => {
    const s = makeState({ age: 60,
      history: [{ age: 59, netWorth: 1_000, wellbeing: 40, level: 'oke', events: [] }, { age: 60, netWorth: 2_000, wellbeing: 60, level: 'oke', events: [] }],
      decisions: [{ age: 30, cardId: 'a', choiceId: 'x', score: 2 }, { age: 31, cardId: 'b', choiceId: 'y', score: 5 }, { age: 32, cardId: 'c', choiceId: 'z', score: 5 }],
      people: { family: 70, friend: 60, partner: null } });
    const r = buildReport(deepFreeze(s), { netWorth: identity, luck: identity });
    expect(r.avgWellbeing).toBe(50);
    expect(r.best?.cardId).toBe('b');
    expect(r.worst?.cardId).toBe('a');
    expect(r.relationships).toBe('strong');
    expect(r.grade).toBe('B+');
    expect(r.series).toHaveLength(2);
  });
});
