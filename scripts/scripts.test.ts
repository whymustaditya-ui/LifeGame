import { execSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';

describe('CLI', () => {
  it('plays a full run from the CLI', () => {
    const out = execSync('npx tsx scripts/sim.ts --seed demo --style balanced', { encoding: 'utf8' });
    expect(out).toContain('Age 60');
    expect(out).toMatch(/Archetype: [a-z_]+/);
  }, 60_000);
});
