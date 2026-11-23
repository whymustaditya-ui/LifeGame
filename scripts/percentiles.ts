import { writeFileSync } from 'node:fs';
import { SAMPLE_CARDS } from '../src/content/sample';
import { playToEnd } from '../src/engine/run';
import { buildTables, pickFor, runOutcome, type Style } from '../src/engine/sim/policies';

const STYLES: readonly Style[] = ['frugal', 'balanced', 'yolo', 'random'];

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const runs = Number(argValue('--runs') ?? 20_000);
if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs must be a positive integer');

const outcomes = Array.from({ length: runs }, (_, i) =>
  runOutcome(playToEnd(`pct-${i}`, SAMPLE_CARDS, pickFor(STYLES[i % STYLES.length] ?? 'balanced'))));
const tables = buildTables(outcomes);
const target = new URL('../src/engine/data/percentiles.json', import.meta.url);
writeFileSync(target, `${JSON.stringify({ runs, generatedAt: new Date().toISOString(), ...tables })}\n`);
process.stdout.write(`Wrote ${runs} runs to src/engine/data/percentiles.json\n`);
