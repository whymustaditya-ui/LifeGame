import { describe, it, expect } from 'vitest';
import { SAMPLE_CARDS } from '../content/sample';
import { rollStart } from './lottery';
import { choose, createRun, currentCard, deserialize, endYear, playToEnd, serialize, type Run } from './run';
import { findSeed } from './test-utils';
import type { Card } from './types';

const first = (card: Card) => card.choices?.[0]?.id ?? 'ok';

describe('the run', () => {
  it('ends after the age-60 year for every start age', () => {
    for (const edu of ['highschool', 'diploma', 'degree'] as const) {
      const seed = findSeed((x) => rollStart(x).education === edu);
      const run = playToEnd(seed, SAMPLE_CARDS, first);
      expect(run.finished).toBe(true);
      expect(run.state.age).toBe(60);
      expect(run.state.history).toHaveLength(60 - run.state.start.startAge + 1);
    }
  });
  it('deals the money plan card in the first year', () => {
    expect(createRun('first-year', SAMPLE_CARDS).queue).toContain('money_plan');
  });
  it('replays identically from the same seed and choices', () => {
    expect(serialize(playToEnd('golden-1', SAMPLE_CARDS, first))).toBe(serialize(playToEnd('golden-1', SAMPLE_CARDS, first)));
  });
  it('continues identically after a mid-run restore', () => {
    let run = createRun('restore-1', SAMPLE_CARDS);
    while (!run.last?.roll) {
      const card = currentCard(run, SAMPLE_CARDS);
      run = card ? choose(run, SAMPLE_CARDS, first(card)) : endYear(run, SAMPLE_CARDS);
      if (run.finished) throw new Error('seed restore-1 never rolled; pick another seed');
    }
    const finish = (r: Run): Run => { let x = r; while (!x.finished) { const c = currentCard(x, SAMPLE_CARDS); x = c ? choose(x, SAMPLE_CARDS, first(c)) : endYear(x, SAMPLE_CARDS); } return x; };
    expect(serialize(finish(deserialize(serialize(run))))).toBe(serialize(finish(run)));
  });
  it('guards the run lifecycle', () => {
    const run = createRun('guards', SAMPLE_CARDS);
    expect(() => endYear(run, SAMPLE_CARDS)).toThrow();
    const empty = { ...run, queue: [] };
    expect(() => choose(empty, SAMPLE_CARDS, 'x')).toThrow();
    expect(() => deserialize('{"queue":[]}')).toThrow();
  });
});
