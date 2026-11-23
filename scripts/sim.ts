import { readFileSync } from 'node:fs';
import { SAMPLE_CARDS } from '../src/content/sample';
import { buildReport } from '../src/engine/report';
import { choose, createRun, currentCard, endYear, type Run } from '../src/engine/run';
import { pickFor, type Style } from '../src/engine/sim/policies';
import { toVisible } from '../src/engine/visible';

const STYLES: readonly Style[] = ['frugal', 'balanced', 'yolo', 'random'];

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const seed = argValue('--seed') ?? 'demo';
const style = STYLES.find((s) => s === (argValue('--style') ?? 'balanced'));
if (!style) throw new Error(`--style must be one of ${STYLES.join(', ')}`);
const pick = pickFor(style);
const tables = JSON.parse(readFileSync(new URL('../src/engine/data/percentiles.json', import.meta.url), 'utf8')) as {
  netWorth: number[]; luck: number[];
};
const rupiah = (n: number): string => `${n < 0 ? '-' : ''}Rp${new Intl.NumberFormat('id-ID').format(Math.abs(n))}`;

let run: Run = createRun(seed, SAMPLE_CARDS);
let picks: string[] = [];
const lines: string[] = [];
while (!run.finished) {
  const card = currentCard(run, SAMPLE_CARDS);
  if (card) {
    const choiceId = pick(card, toVisible(run.state), run);
    picks = [...picks, `${card.id}:${choiceId}`];
    run = choose(run, SAMPLE_CARDS, choiceId);
  } else {
    run = endYear(run, SAMPLE_CARDS);
    const year = run.state.history.at(-1);
    if (year) lines.push(`Age ${year.age} | ${rupiah(year.netWorth)} | ${year.level} | ${picks.join(', ')}`);
    picks = [];
  }
}

const report = buildReport(run.state, tables);
process.stdout.write(`${[...lines, `Grade: ${report.grade}`, `Luck percentile: ${report.luckPct}`, `Archetype: ${report.archetype}`].join('\n')}\n`);
