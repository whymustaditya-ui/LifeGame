import { luckScore } from '../report';
import { draw, keyOf } from '../rng';
import { netWorth } from '../state';
import type { Run } from '../run';
import type { Card, Choice, VisibleState } from '../types';

export type Style = 'frugal' | 'balanced' | 'yolo' | 'random';
export type Picker = (card: Card, v: VisibleState, run: Run) => string;

function pickBest(choices: readonly [Choice, ...Choice[]], better: (a: Choice, b: Choice) => boolean): Choice {
  return choices.reduce((best, c) => (better(c, best) ? c : best));
}

/** Scripted player styles for simulations. Luck cards always answer 'ok'. */
export function pickFor(style: Style): Picker {
  return (card, v, run) => {
    const choices = card.choices ?? [];
    if (card.kind === 'luck' || choices.length === 0) return 'ok';
    const list = choices as readonly [Choice, ...Choice[]];
    const cash = (c: Choice): number => c.effect(run.state).cash ?? 0;
    const mood = (c: Choice): number => c.effect(run.state).wellbeing ?? 0;
    switch (style) {
      case 'frugal':
        return pickBest(list, (a, b) => cash(a) > cash(b)).id;
      case 'yolo':
        return pickBest(list, (a, b) => mood(a) > mood(b) || (mood(a) === mood(b) && cash(a) < cash(b))).id;
      case 'balanced':
        return pickBest(list, (a, b) => (a.grade?.(v) ?? 0) > (b.grade?.(v) ?? 0)).id;
      case 'random': {
        const i = Math.floor(draw(run.state.seed, keyOf(run.state.age, 'policy', card.id)) * list.length);
        return (list[i] ?? list[0]).id;
      }
    }
  };
}

export function runOutcome(run: Run): { netWorth: number; luck: number } {
  return { netWorth: netWorth(run.state.fin), luck: luckScore(run.state.luck) };
}

/** 101 nearest-rank quantiles per metric: q[p] = sorted[min(n - 1, max(0, ceil(p / 100 * n) - 1))]. */
export function buildTables(runs: readonly { netWorth: number; luck: number }[]): { netWorth: number[]; luck: number[] } {
  if (runs.length === 0) throw new Error('buildTables: no runs');
  const quantiles = (values: readonly number[]): number[] => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    return Array.from({ length: 101 }, (_, p) => sorted[Math.min(n - 1, Math.max(0, Math.ceil((p / 100) * n) - 1))] as number);
  };
  return { netWorth: quantiles(runs.map((r) => r.netWorth)), luck: quantiles(runs.map((r) => r.luck)) };
}
