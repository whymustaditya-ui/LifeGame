# Lifeworth Engine Implementation Plan (Plan 1 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure TypeScript game engine (seeded randomness, birth lottery, economy, wellbeing, cards, grading, luck, report) plus a terminal simulator, so a full run from first job to 60 can be played and tested without any UI.

**Architecture:** A dependency-free module in `src/engine/` made of pure functions over plain-data state. Content cards are typed TypeScript objects passed in by the caller. Every random number is addressed by `(seed, key)`, so runs replay exactly. Scripts in `scripts/` play runs with scripted player styles and generate percentile tables.

**Tech Stack:** TypeScript ~6.0.2 (strict), Vitest ^4.1.9 with @vitest/coverage-v8, tsx for scripts, Node 24.

**Spec:** `docs/superpowers/specs/2026-11-23-lifeworth-design.md`

**Plan series:** 1 Engine (this plan), 2 Game UI, 3 Content and tuning (full card set, pacing test, 100,000-run percentile tables), 4 Share, PWA and release. Plans 2 to 4 are written after this one lands.

## Global Constraints

- TypeScript `strict: true` and `noUncheckedIndexedAccess: true`; no `any` in `src/engine`.
- `src/engine` imports nothing from React, the DOM or Node built-ins. Only `scripts/` may use Node.
- Engine functions are pure: they return new objects and never mutate inputs. Tests pass deep-frozen inputs.
- Money is integer Rupiah in today's money (inflation-adjusted). Apply `Math.round` after every multiplication.
- Locales are exactly `'en'` and `'jaksel'`; every player-facing string exists in both.
- Wellbeing levels: Seger 70+, Oke 40 to 69, Capek 20 to 39, Burnout under 20.
- Start age is 18, 21 or 22 by education; the run ends after the age-60 year.
- At most two cards per year, guaranteed cards first.
- Random numbers come only from `draw(seed, key)` with keys from `keyOf(age, stream, id)`. Never `Math.random`, never screen position.
- Grading functions receive `VisibleState` only.
- Copy: no em dash and no double hyphen, no emoji, no real company names.
- Coverage for `src/engine/**` at 80% or more for lines, branches, functions and statements.
- Conventional commit messages (`feat:`, `test:`, `chore:`, `docs:`), no attribution trailer.

## Review Focus

1. A year where costs exceed income with no cash (unemployed, supporting parents): cash never goes negative, the shortfall becomes pinjol, and net worth may go negative. Pinned in Task 5.
2. Seeds from challenge links can be any string (empty, emoji, 10,000 characters): draws stay deterministic and inside [0, 1). Pinned in Task 1.
3. The eligible card pool runs dry (small content, non-repeatable cards used up): the year is quiet, with no crash and no loop. Pinned in Task 7.
4. Different start ages: every run ends after age 60 with `60 - startAge + 1` history entries. Pinned in Task 11.
5. A refresh mid-year, including right after a choice with an outcome roll: a deserialized run continues exactly like the original. Pinned in Task 11.

---

### Task 1: Scaffold and seeded draws

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/engine/rng.ts`
- Modify: `.gitignore` (append `node_modules/`, `dist/`, `coverage/`)
- Test: `src/engine/rng.test.ts`

**Interfaces:**
- Produces: `type Stream = 'lottery' | 'deal' | 'luck' | 'career' | 'outcome' | 'policy'`, `hashKey(input: string): number` (unsigned 32-bit), `draw(seed: string, key: string): number` in [0, 1), `keyOf(age: number, stream: Stream, id: string | number): string`.

- [ ] **Step 1: Create the project files**

`package.json`: name `lifeworth`, private, version `0.1.0`, `"type": "module"`. Scripts: `test` = `vitest run`, `test:watch` = `vitest`, `coverage` = `vitest run --coverage`, `typecheck` = `tsc --noEmit`, `sim` = `tsx scripts/sim.ts`, `percentiles` = `tsx scripts/percentiles.ts`. devDependencies: `typescript ~6.0.2`, `vitest ^4.1.9`, `@vitest/coverage-v8 ^4.1.9`, `tsx ^4.19.0`, `@types/node ^24.12.3`.

`tsconfig.json`: target `ES2022`, module `ESNext`, moduleResolution `Bundler`, `strict`, `noUncheckedIndexedAccess`, `resolveJsonModule`, `isolatedModules`, `verbatimModuleSyntax`, `skipLibCheck`, `noEmit`, types `["node"]`, include `["src", "scripts"]`.

`vitest.config.ts`: test include `src/**/*.test.ts` and `scripts/**/*.test.ts`; coverage provider `v8`, include `src/engine/**`, exclude `src/engine/**/*.test.ts`, `src/engine/test-utils.ts`, `src/engine/data/**`, thresholds 80 for lines, branches, functions and statements.

Run: `npm install`
Expected: `package-lock.json` created, no errors.

- [ ] **Step 2: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { draw, keyOf } from './rng';

describe('draw', () => {
  it('is deterministic for the same seed and key', () => {
    expect(draw('abc', '27|deal|0')).toBe(draw('abc', '27|deal|0'));
  });
  it('stays in [0, 1)', () => {
    for (let i = 0; i < 10_000; i++) {
      const x = draw('abc', `k${i}`);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it('differs across keys and seeds', () => {
    expect(draw('abc', '27|deal|0')).not.toBe(draw('abc', '27|deal|1'));
    expect(draw('abc', '27|deal|0')).not.toBe(draw('abd', '27|deal|0'));
  });
  it('handles any seed string', () => {
    for (const seed of ['', '🙂', 'x'.repeat(10_000)]) {
      const x = draw(seed, '22|lottery|family');
      expect(Number.isFinite(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(draw(seed, '22|lottery|family')).toBe(x);
    }
  });
  it('averages close to 0.5', () => {
    let sum = 0;
    for (let i = 0; i < 10_000; i++) sum += draw('mean', `k${i}`);
    expect(Math.abs(sum / 10_000 - 0.5)).toBeLessThan(0.02);
  });
});

describe('keyOf', () => {
  it('formats age, stream and id', () => {
    expect(keyOf(27, 'deal', 0)).toBe('27|deal|0');
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/engine/rng.test.ts`
Expected: FAIL, cannot resolve `./rng`.

- [ ] **Step 4: Implement `src/engine/rng.ts`**

`hashKey` is a 32-bit string hash over UTF-16 code units (xmur3 or cyrb53 truncated to 32 bits). `draw(seed, key)` seeds mulberry32 with `hashKey(seed + '\u0000' + key)` and returns its first output divided by 2^32. `keyOf` returns `` `${age}|${stream}|${id}` ``. No module-level state.

- [ ] **Step 5: Run the tests and typecheck**

Run: `npx vitest run src/engine/rng.test.ts` then `npm run typecheck`
Expected: 6 tests pass; no type errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore src/engine/rng.ts src/engine/rng.test.ts
git commit -m "feat: scaffold engine and add seeded draws"
```

---

### Task 2: Types, tuning config and wellbeing helpers

**Files:**
- Create: `src/engine/types.ts`, `src/engine/config.ts`, `src/engine/wellbeing.ts`
- Test: `src/engine/wellbeing.test.ts`

**Interfaces:**
- Consumes: `Stream` from Task 1.
- Produces: the types below (every later task uses these names exactly), the constants in the config table, and `levelOf(score: number): WellbeingLevel`, `stageOf(age: number): LifeStage`, `oddsMultiplier(level: WellbeingLevel, tone: 'good' | 'bad'): number`, `stressFactor(t: Temperament): number`, `fomoFactor(t: Temperament): number`, `applyWellbeingDelta(score: number, delta: number, t: Temperament): number`.

```ts
// src/engine/types.ts
export type { Stream } from './rng';
export type Locale = 'en' | 'jaksel';
export type Localized<T> = Readonly<Record<Locale, T>>;
export type FamilyMoney = 'poor' | 'middle' | 'rich';
export type Education = 'highschool' | 'diploma' | 'degree';
export type Temperament = 'anxious' | 'impulsive' | 'steady';
export type WellbeingLevel = 'seger' | 'oke' | 'capek' | 'burnout';
export type LifeStage = 'early' | 'building' | 'peak' | 'preretire';
export type MoneyPlan = 'save_all' | 'half_index' | 'invest_most';
export type DecisionScore = 1 | 2 | 3 | 4 | 5;
export type LetterGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'E';
export type Trigger = 'first_salary' | 'career_change' | 'married' | 'child' | 'kpr'
  | 'capek' | 'pinjol' | 'first_job_insurance' | 'family_insurance';
export type CardKind = 'dilemma' | 'luck' | 'feed';

export interface StartProfile { family: FamilyMoney; education: Education; supportsParents: boolean;
  temperament: Temperament; startAge: 18 | 21 | 22; luckPoints: number }
export interface Finances { cash: number; index: number; property: number; kpr: number; kprMonthly: number;
  pinjol: number; cardDebt: number; insured: boolean }
export interface Career { employed: boolean; level: number; monthlyIncome: number; lastIncome: number;
  titleKey: string; security: number }
export interface People { family: number; friend: number; partner: number | null }
export interface YearRecord { age: number; netWorth: number; wellbeing: number; level: WellbeingLevel; events: string[] }
export interface DecisionRecord { age: number; cardId: string; choiceId: string; score: DecisionScore }
export interface LuckEntry { age: number; source: string; expected: number; actual: number }
export interface GameState {
  seed: string; age: number; start: StartProfile; fin: Finances; career: Career;
  monthlyLifestyle: number; plan: MoneyPlan | null; wellbeing: number; people: People;
  married: boolean; children: number; capekYears: number; burnoutYears: number;
  flags: Readonly<Record<string, true>>; seen: readonly string[];
  history: readonly YearRecord[]; decisions: readonly DecisionRecord[]; luck: readonly LuckEntry[];
}
export interface VisibleState {
  age: number; stage: LifeStage; cash: number; emergencyMonths: number; index: number; property: number;
  debt: { kpr: number; pinjol: number; cardDebt: number }; insured: boolean; netWorth: number;
  employed: boolean; monthlyIncome: number; titleKey: string; monthlyCosts: number;
  wellbeingLevel: WellbeingLevel; married: boolean; children: number; supportsParents: boolean; plan: MoneyPlan | null;
}
export interface Effect {
  cash?: number; index?: number; pinjol?: number; cardDebt?: number;
  wellbeing?: number; family?: number; friend?: number; partner?: number; security?: number;
  monthlyLifestyle?: number; monthlyIncomeFactor?: number;
  setPlan?: MoneyPlan; setInsured?: boolean; setEmployed?: boolean; setMarried?: boolean;
  addChild?: boolean; setFlag?: string;
  startKpr?: { price: number; downPayment: number; monthly: number };
}
export interface Outcome { effect: (s: GameState) => Effect; luck: number; copy: Localized<string> }
export interface Roll { p: (s: GameState) => number; hit: Outcome; miss: Outcome }
export interface Choice {
  id: string; copy: Localized<{ label: string; note?: string }>;
  effect: (s: GameState) => Effect; grade?: (v: VisibleState) => DecisionScore;
  roll?: Roll; result?: Localized<string>;
}
export interface Card {
  id: string; kind: CardKind; stages: readonly LifeStage[]; repeatable: boolean; weight: number;
  triggers?: readonly Trigger[]; eligible?: (s: GameState) => boolean;
  copy: Localized<string>; choices?: readonly Choice[]; roll?: Roll;
}
```

Config values (`src/engine/config.ts`, `as const` records keyed by the union types):

| Constant | Value |
|-|-|
| `END_AGE` | 60 |
| `START_AGE` | highschool 18, diploma 21, degree 22 |
| `START_INCOME` (monthly) | highschool 5_400_000, diploma 6_500_000, degree 8_000_000 |
| `START_CASH` | poor 2_000_000, middle 10_000_000, rich 50_000_000 |
| `START_LIFESTYLE` (monthly) | 3_500_000 |
| `PARENT_SUPPORT` (monthly) | 2_000_000 |
| `CHILD_COST` (monthly) | 1_500_000 |
| `THR_MONTHS` | 13 |
| `INDEX_RETURN`, `PROPERTY_GROWTH`, `KPR_RATE` | 0.05, 0.01, 0.05 |
| `PINJOL_RATE`, `CARD_RATE` | 0.60, 0.25 |
| `PLAN_CASH_SHARE` | save_all 1.0, half_index 0.5, invest_most 0.2 |
| `START_WELLBEING`, `START_SECURITY` | 60, 60 |
| `START_PEOPLE` | family 60, friend 60, partner null |
| `WELLBEING_ANCHOR`, `WELLBEING_PULL` | 55, 0.1 |
| `WORK_STRESS`, `UNEMPLOYED_STRESS` | 2, 10 |
| `RAISE_RATE` | seger 0.04, oke 0.03, capek 0, burnout 0 |
| `PROMOTION_BASE` | early 0.18, building 0.15, peak 0.08, preretire 0.03 |
| `PROMOTION_MULT` | seger 1.3, oke 1.0, capek 0.6, burnout 0.3 |
| `PROMOTION_RAISE` | 0.15 |
| `FIRING_CHANCE` | seger 0, oke 0, capek 0, burnout 0.25 |
| `REHIRE_BASE`, `REHIRE_PAY` | 0.6, 0.9 |
| `PEOPLE_DRIFT` | seger 3, oke 0, capek -4, burnout -8 |
| `ODDS_BAD` | seger 0.8, oke 1.0, capek 1.4, burnout 1.8 |
| `ODDS_GOOD` | seger 1.25, oke 1.0, capek 0.8, burnout 0.6 |
| `STRESS_FACTOR` | anxious 1.5, impulsive 1.0, steady 0.8 |
| `FOMO_FACTOR` | anxious 1.2, impulsive 1.3, steady 0.8 |
| `CARD_CHANCE` | [0.55, 0.2] (random slot 0, slot 1) |
| `MAX_CARDS_PER_YEAR` | 2 |
| `LUCK_CAREER` | promotion 20, fired -40, rehired 10 |

- [ ] **Step 1: Write the failing tests**

```ts
it('maps scores to levels at the boundaries', () => {
  expect([100, 70, 69, 40, 39, 20, 19, 0].map(levelOf))
    .toEqual(['seger', 'seger', 'oke', 'oke', 'capek', 'capek', 'burnout', 'burnout']);
});
it('maps ages to life stages', () => {
  expect([29, 30, 39, 40, 49, 50, 60].map(stageOf))
    .toEqual(['early', 'building', 'building', 'peak', 'peak', 'preretire', 'preretire']);
});
it('returns odds multipliers', () => {
  expect(oddsMultiplier('burnout', 'bad')).toBe(1.8);
  expect(oddsMultiplier('seger', 'good')).toBe(1.25);
});
it('scales only negative deltas by temperament and clamps', () => {
  expect(applyWellbeingDelta(50, -10, 'anxious')).toBe(35);
  expect(applyWellbeingDelta(50, -10, 'steady')).toBe(42);
  expect(applyWellbeingDelta(50, 10, 'anxious')).toBe(60);
  expect(applyWellbeingDelta(5, -20, 'impulsive')).toBe(0);
  expect(applyWellbeingDelta(95, 20, 'steady')).toBe(100);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/wellbeing.test.ts`
Expected: FAIL, cannot resolve `./wellbeing`.

- [ ] **Step 3: Implement `types.ts`, `config.ts` and `wellbeing.ts`**

`applyWellbeingDelta` multiplies a negative delta by `STRESS_FACTOR[t]`, rounds, adds, and clamps to 0..100.

- [ ] **Step 4: Run the tests and typecheck**

Run: `npx vitest run src/engine/wellbeing.test.ts` then `npm run typecheck`
Expected: 4 tests pass; no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/config.ts src/engine/wellbeing.ts src/engine/wellbeing.test.ts
git commit -m "feat: add engine types, tuning config and wellbeing helpers"
```

---

### Task 3: Birth lottery

**Files:**
- Create: `src/engine/lottery.ts`
- Modify: `src/engine/config.ts` (add the lottery constants below)
- Test: `src/engine/lottery.test.ts`

**Interfaces:**
- Consumes: `draw`, `keyOf`, `StartProfile`, config.
- Produces: `rollStart(seed: string): StartProfile`, `startLuckPoints(p: Pick<StartProfile, 'family' | 'education' | 'supportsParents' | 'temperament'>): number`, `expectedStartLuck(): number`, `startLuckPercentile(points: number): number` (integer 0..100: probability mass strictly below plus half the mass equal, times 100, rounded).

Lottery constants. Each roll uses `draw(seed, keyOf(0, 'lottery', name))` with names `family`, `education`, `parents`, `temperament`, and picks by cumulative thresholds in the listed order (for family: below 0.35 poor, below 0.85 middle, else rich):

| Roll | Values |
|-|-|
| family | poor 0.35, middle 0.50, rich 0.15 |
| education given poor | highschool 0.60, diploma 0.25, degree 0.15 |
| education given middle | highschool 0.30, diploma 0.30, degree 0.40 |
| education given rich | highschool 0.10, diploma 0.15, degree 0.75 |
| supports parents given family | poor 0.70, middle 0.35, rich 0.05 |
| temperament | anxious, impulsive, steady, one third each |
| luck points | family poor -30, middle 0, rich 30; education highschool -15, diploma 0, degree 10; supports parents -15; temperament steady 5, anxious -5, impulsive -5 |

`expectedStartLuck` and `startLuckPercentile` enumerate all 54 combinations with their probabilities; no simulation.

- [ ] **Step 1: Write the failing tests**

```ts
it('is deterministic', () => expect(rollStart('demo')).toEqual(rollStart('demo')));
it('sets start age from education', () => {
  for (let i = 0; i < 200; i++) {
    const p = rollStart(`s${i}`);
    expect(p.startAge).toBe({ highschool: 18, diploma: 21, degree: 22 }[p.education]);
  }
});
it('matches the family odds over 20,000 seeds', () => {
  const n = 20_000; const c = { poor: 0, middle: 0, rich: 0 };
  for (let i = 0; i < n; i++) c[rollStart(`f${i}`).family]++;
  expect(Math.abs(c.poor / n - 0.35)).toBeLessThan(0.015);
  expect(Math.abs(c.rich / n - 0.15)).toBeLessThan(0.015);
});
it('scores the worst and best starts', () => {
  expect(startLuckPoints({ family: 'poor', education: 'highschool', supportsParents: true, temperament: 'anxious' })).toBe(-65);
  expect(startLuckPoints({ family: 'rich', education: 'degree', supportsParents: false, temperament: 'steady' })).toBe(45);
});
it('ranks starts by percentile', () => {
  expect(startLuckPercentile(-65)).toBeLessThan(5);
  expect(startLuckPercentile(45)).toBeGreaterThan(95);
  expect(startLuckPercentile(-20)).toBeLessThanOrEqual(startLuckPercentile(0));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/lottery.test.ts`
Expected: FAIL, cannot resolve `./lottery`.

- [ ] **Step 3: Implement `src/engine/lottery.ts`**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/lottery.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/lottery.ts src/engine/lottery.test.ts src/engine/config.ts
git commit -m "feat: add birth lottery with exact start-luck percentiles"
```

---

### Task 4: Initial state, visible snapshot and test fixtures

**Files:**
- Create: `src/engine/state.ts`, `src/engine/visible.ts`, `src/engine/test-utils.ts`
- Test: `src/engine/visible.test.ts`

**Interfaces:**
- Consumes: `StartProfile`, `GameState`, `VisibleState`, config, `expectedStartLuck`, `levelOf`, `stageOf`.
- Produces: `initialState(seed: string, start: StartProfile): GameState`, `netWorth(fin: Finances): number`, `monthlyCosts(s: GameState): number`, `toVisible(s: GameState): VisibleState`; test helpers `deepFreeze<T>(x: T): T` and `makeState(overrides?: Partial<GameState>): GameState` (from `initialState('fixture', { family: 'middle', education: 'degree', supportsParents: false, temperament: 'steady', startAge: 22, luckPoints: 15 })` with shallow overrides).

`initialState`: age = `startAge`; fin = cash `START_CASH[family]`, everything else 0, insured false; career = employed, level 0, monthlyIncome and lastIncome `START_INCOME[education]`, titleKey `` `${education}_0` ``, security `START_SECURITY`; monthlyLifestyle `START_LIFESTYLE`; plan null; wellbeing `START_WELLBEING`; people `START_PEOPLE`; married false; children 0; counters 0; flags {}; seen, history and decisions empty; luck `[{ age: startAge, source: 'start', expected: expectedStartLuck(), actual: luckPoints }]`.

`netWorth` = cash + index + property - kpr - pinjol - cardDebt. `monthlyCosts` = monthlyLifestyle + (supportsParents ? `PARENT_SUPPORT` : 0) + children times `CHILD_COST` + kprMonthly. `toVisible.emergencyMonths` = cash / monthlyCosts rounded to one decimal, or 99 when monthlyCosts is 0. `VisibleState` never carries wellbeing as a number, relationships or security.

- [ ] **Step 1: Write the failing tests**

```ts
it('builds the initial state from the start profile', () => {
  const s = initialState('x', { family: 'poor', education: 'highschool', supportsParents: true, temperament: 'anxious', startAge: 18, luckPoints: -65 });
  expect(s.age).toBe(18);
  expect(s.fin.cash).toBe(2_000_000);
  expect(s.career.monthlyIncome).toBe(5_400_000);
  expect(s.luck[0]).toMatchObject({ source: 'start', actual: -65 });
});
it('computes net worth including debt', () => {
  expect(netWorth({ cash: 10_000_000, index: 5_000_000, property: 0, kpr: 0, kprMonthly: 0, pinjol: 20_000_000, cardDebt: 0, insured: false })).toBe(-5_000_000);
});
it('sums monthly costs', () => {
  const s = makeState({ children: 1, start: { ...makeState().start, supportsParents: true }, fin: { ...makeState().fin, kprMonthly: 3_000_000 } });
  expect(monthlyCosts(s)).toBe(10_000_000);
});
it('reports emergency months and hides felt values', () => {
  const v = toVisible(deepFreeze(makeState({ fin: { ...makeState().fin, cash: 7_000_000 } })));
  expect(v.emergencyMonths).toBe(2);
  expect(v.stage).toBe('early');
  expect(Object.keys(v)).not.toContain('wellbeing');
  expect(Object.keys(v)).not.toContain('people');
});
it('uses 99 emergency months when there are no costs', () => {
  expect(toVisible(makeState({ monthlyLifestyle: 0 })).emergencyMonths).toBe(99);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/visible.test.ts`
Expected: FAIL, cannot resolve `./state`.

- [ ] **Step 3: Implement `state.ts`, `visible.ts` and `test-utils.ts`**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/visible.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/state.ts src/engine/visible.ts src/engine/test-utils.ts src/engine/visible.test.ts
git commit -m "feat: add initial state and the visible snapshot"
```

---

### Task 5: Yearly economy

**Files:**
- Create: `src/engine/economy.ts`
- Test: `src/engine/economy.test.ts`

**Interfaces:**
- Consumes: `GameState`, `monthlyCosts`, config.
- Produces: `economyTick(s: GameState): GameState` (deterministic, no randomness).

Order, each step reading the result of the one before:
1. Growth on opening balances: index times (1 + `INDEX_RETURN`), property times (1 + `PROPERTY_GROWTH`).
2. Interest on opening debt: pinjol times (1 + `PINJOL_RATE`), cardDebt times (1 + `CARD_RATE`), kpr times (1 + `KPR_RATE`) minus kprMonthly times 12, floored at 0; when kpr reaches 0, kprMonthly becomes 0.
3. Income: employed ? monthlyIncome times `THR_MONTHS` : 0.
4. Costs: `monthlyCosts(s)` times 12.
5. Leftover = income - costs. If leftover >= 0: cash gets `Math.round(leftover * PLAN_CASH_SHARE[plan ?? 'save_all'])` and index gets the rest. If leftover < 0: take it from cash; anything cash cannot cover becomes pinjol, and cash floors at 0.

- [ ] **Step 1: Write the failing tests**

```ts
const base = () => makeState({ plan: 'half_index', monthlyLifestyle: 5_000_000,
  career: { ...makeState().career, monthlyIncome: 8_000_000 }, fin: { ...makeState().fin, cash: 10_000_000 } });

it('saves salary plus THR with the half_index plan', () => {
  const s = economyTick(deepFreeze(base()));
  expect(s.fin.cash).toBe(32_000_000);
  expect(s.fin.index).toBe(22_000_000);
});
it('grows the opening index before contributions', () => {
  const s = economyTick(makeState({ plan: 'save_all', monthlyLifestyle: 6_500_000,
    career: { ...makeState().career, monthlyIncome: 6_000_000 }, fin: { ...makeState().fin, index: 100_000_000 } }));
  expect(s.fin.index).toBe(105_000_000);
});
it('turns a shortfall into pinjol and never leaves cash negative', () => {
  const s = economyTick(makeState({ start: { ...makeState().start, supportsParents: true },
    career: { ...makeState().career, employed: false, monthlyIncome: 0 }, fin: { ...makeState().fin, cash: 5_000_000 } }));
  expect(s.fin.cash).toBe(0);
  expect(s.fin.pinjol).toBe(61_000_000);
  expect(netWorth(s.fin)).toBe(-61_000_000);
});
it('compounds pinjol at 60% a year', () => {
  const s = economyTick(makeState({ monthlyLifestyle: 0, career: { ...makeState().career, employed: false, monthlyIncome: 0 },
    fin: { ...makeState().fin, cash: 0, pinjol: 10_000_000 } }));
  expect(s.fin.pinjol).toBe(16_000_000);
});
it('pays down the KPR', () => {
  const s = economyTick(makeState({ fin: { ...makeState().fin, kpr: 100_000_000, kprMonthly: 1_000_000 } }));
  expect(s.fin.kpr).toBe(93_000_000);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/economy.test.ts`
Expected: FAIL, cannot resolve `./economy`.

- [ ] **Step 3: Implement `economyTick` in `src/engine/economy.ts`**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/economy.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/economy.ts src/engine/economy.test.ts
git commit -m "feat: add the yearly economy tick"
```

---

### Task 6: Yearly life dynamics

**Files:**
- Create: `src/engine/life.ts`
- Test: `src/engine/life.test.ts`

**Interfaces:**
- Consumes: config, `levelOf`, `stageOf`, `applyWellbeingDelta`, `keyOf`.
- Produces: `type Rnd = (key: string) => number` and `lifeTick(s: GameState, rnd: Rnd): { state: GameState; luck: LuckEntry[]; careerChanged: boolean }`.

Order:
1. Wellbeing: add `Math.round((WELLBEING_ANCHOR - w) * WELLBEING_PULL)`, then apply `-WORK_STRESS` if employed or `-UNEMPLOYED_STRESS` if not, through `applyWellbeingDelta`.
2. `L = levelOf(new wellbeing)`. capekYears = L is capek or burnout ? capekYears + 1 : 0. burnoutYears += L is burnout ? 1 : 0.
3. People: family, friend and partner (when not null) add `PEOPLE_DRIFT[L]`, clamped 0..100.
4. Career when employed: firing roll first, `rnd(keyOf(age, 'career', 'fired')) < FIRING_CHANCE[L]`, only when that chance is above 0, with luck entry `{ source: 'fired', expected: p * -40, actual: hit ? -40 : 0 }`. If fired: employed false, lastIncome = monthlyIncome, monthlyIncome 0, careerChanged, and skip the rest. Otherwise apply the raise (times 1 + `RAISE_RATE[L]`), then the promotion roll `rnd(keyOf(age, 'career', 'promotion')) < PROMOTION_BASE[stage] * PROMOTION_MULT[L]`: on a hit, income times (1 + `PROMOTION_RAISE`), level + 1, titleKey `` `${education}_${level}` ``, careerChanged. Luck entry `{ source: 'promotion', expected: p * 20, actual: hit ? 20 : 0 }`.
5. Career when unemployed: rehire roll `rnd(keyOf(age, 'career', 'rehire')) < REHIRE_BASE * PROMOTION_MULT[L]`: on a hit, employed, monthlyIncome = `Math.round(lastIncome * REHIRE_PAY)`, careerChanged. Luck entry `{ source: 'rehire', expected: p * 10, actual: hit ? 10 : 0 }`.

- [ ] **Step 1: Write the failing tests**

```ts
const rndOf = (m: Record<string, number>): Rnd => (k) => m[k.split('|')[2] as string] ?? 0.99;

it('pulls wellbeing toward 55 and applies work stress', () => {
  expect(lifeTick(deepFreeze(makeState({ wellbeing: 81 })), rndOf({})).state.wellbeing).toBe(76);
});
it('counts consecutive capek years and resets them', () => {
  expect(lifeTick(makeState({ wellbeing: 25, capekYears: 2 }), rndOf({})).state.capekYears).toBe(3);
  expect(lifeTick(makeState({ wellbeing: 80, capekYears: 2 }), rndOf({})).state.capekYears).toBe(0);
});
it('drifts relationships by level and leaves a missing partner alone', () => {
  const r = lifeTick(makeState({ wellbeing: 5 }), rndOf({})).state.people;
  expect(r.family).toBe(52);
  expect(r.partner).toBeNull();
});
it('raises, then promotes when the draw is under the odds', () => {
  const r = lifeTick(makeState({ wellbeing: 55, career: { ...makeState().career, monthlyIncome: 8_000_000 } }), rndOf({ promotion: 0.1 }));
  expect(r.state.career.monthlyIncome).toBe(9_476_000);
  expect(r.state.career.level).toBe(1);
  expect(r.careerChanged).toBe(true);
  expect(r.luck).toContainEqual(expect.objectContaining({ source: 'promotion', actual: 20 }));
  expect(r.luck.find((e) => e.source === 'promotion')?.expected).toBeCloseTo(3.6);
});
it('fires only at burnout', () => {
  expect(lifeTick(makeState({ wellbeing: 30 }), rndOf({ fired: 0 })).state.career.employed).toBe(true);
  const r = lifeTick(makeState({ wellbeing: 5 }), rndOf({ fired: 0.1 }));
  expect(r.state.career.employed).toBe(false);
  expect(r.state.career.monthlyIncome).toBe(0);
  expect(r.luck).toContainEqual(expect.objectContaining({ source: 'fired', expected: -10, actual: -40 }));
});
it('rehires at 90% of the last income', () => {
  const r = lifeTick(makeState({ wellbeing: 60, career: { ...makeState().career, employed: false, monthlyIncome: 0, lastIncome: 10_000_000 } }), rndOf({ rehire: 0.5 }));
  expect(r.state.career.monthlyIncome).toBe(9_000_000);
});
it('hits anxious unemployed players harder', () => {
  const s = makeState({ wellbeing: 55, start: { ...makeState().start, temperament: 'anxious' }, career: { ...makeState().career, employed: false, monthlyIncome: 0 } });
  expect(lifeTick(s, rndOf({})).state.wellbeing).toBe(40);
});
```

Note on the first test: 81 plus round(-2.6) is 78, then -2 scaled by steady 0.8 is -1.6, which rounds to -2, giving 76.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/life.test.ts`
Expected: FAIL, cannot resolve `./life`.

- [ ] **Step 3: Implement `lifeTick` in `src/engine/life.ts`**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/life.test.ts`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/life.ts src/engine/life.test.ts
git commit -m "feat: add yearly wellbeing, relationship and career dynamics"
```

---

### Task 7: Dealing the year's cards

**Files:**
- Create: `src/engine/deal.ts`
- Test: `src/engine/deal.test.ts`

**Interfaces:**
- Consumes: `Card`, `Trigger`, `GameState`, `draw`, `keyOf`, `levelOf`, `stageOf`, config.
- Produces: `dueTriggers(s: GameState): Trigger[]` and `dealYear(s: GameState, content: readonly Card[]): { cardIds: string[]; state: GameState }`.

`dueTriggers`, in priority order:
1. `capek` when `levelOf(wellbeing)` is capek or burnout.
2. `pinjol` when `fin.pinjol > 0`.
3. At most one money plan trigger, the first that applies: `career_change` (flag `career_changed`), `first_salary` (employed and no flag `first_salary_seen`), `married` (flag `just_married`), `child` (flag `just_child`), `kpr` (flag `just_kpr`).
4. At most one insurance trigger, only when not insured: `first_job_insurance` (employed and no flag `first_insurance_seen`), else `family_insurance` (flag `just_married` or `just_child`).

`dealYear`: for each due trigger, the first card whose `triggers` contains it, skipping cards already picked this year and cards whose `eligible` returns false, until `MAX_CARDS_PER_YEAR`. Then for each remaining random slot `i` (counting from 0): if `draw(seed, keyOf(age, 'deal', 2 * i)) < CARD_CHANCE[i]`, pick from the random pool (cards without `triggers`, stage included, `eligible` true or absent, repeatable or not in `seen`, not picked this year) by weight using `draw(seed, keyOf(age, 'deal', 2 * i + 1))`. An empty pool deals nothing. The returned state appends the dealt ids to `seen`, clears `career_changed`, `just_married`, `just_child` and `just_kpr` only when the card for that trigger was dealt, and sets `first_salary_seen` or `first_insurance_seen` when those cards were dealt.

- [ ] **Step 1: Write the failing tests**

Fixture cards live in the test file: `recovery` (triggers `['capek']`), `pinjol_payoff` (`['pinjol']`), `money_plan` (`['first_salary', 'career_change', 'married', 'child', 'kpr']`), `insurance_offer` (`['first_job_insurance', 'family_insurance']`), and random cards `r1`, `r2`, `r3` (stages all four, weight 1, repeatable true).

```ts
it('puts recovery first and caps the year at two cards', () => {
  const s = makeState({ wellbeing: 25, fin: { ...makeState().fin, pinjol: 1 }, flags: { career_changed: true } });
  expect(dealYear(deepFreeze(s), cards).cardIds).toEqual(['recovery', 'pinjol_payoff']);
});
it('deals one money plan card even when several triggers fire', () => {
  const s = makeState({ flags: { career_changed: true, just_married: true, first_salary_seen: true, first_insurance_seen: true }, fin: { ...makeState().fin, insured: true } });
  expect(dealYear(s, cards).cardIds.filter((id) => id === 'money_plan')).toHaveLength(1);
});
it('is deterministic for the same seed and state', () => {
  const s = makeState({ flags: { first_salary_seen: true, first_insurance_seen: true } });
  expect(dealYear(s, cards)).toEqual(dealYear(s, cards));
});
it('gives random slot 0 the same draw whether or not a guaranteed card came first', () => {
  const seed = findSeed((x) => draw(x, keyOf(22, 'deal', 0)) < 0.2);
  const quiet = makeState({ seed, flags: { first_salary_seen: true, first_insurance_seen: true } });
  const busy = { ...quiet, flags: { ...quiet.flags, career_changed: true as const } };
  const randomIn = (ids: string[]) => ids.filter((id) => id.startsWith('r'));
  expect(randomIn(dealYear(busy, cards).cardIds)[0]).toBe(randomIn(dealYear(quiet, cards).cardIds)[0]);
});
it('has a quiet year when the pool runs dry', () => {
  const once = [{ ...r1, repeatable: false }];
  const s = makeState({ seen: ['r1'], flags: { first_salary_seen: true, first_insurance_seen: true } });
  expect(dealYear(s, once).cardIds).toEqual([]);
});
it('clears a one-shot flag only when its card is dealt', () => {
  const s = makeState({ flags: { career_changed: true, first_salary_seen: true, first_insurance_seen: true } });
  expect(dealYear(s, cards).state.flags.career_changed).toBeUndefined();
});
```

`findSeed(pred)` is added to `test-utils.ts`: it returns the first `s${i}` (i from 0 to 9,999) that satisfies `pred`.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/deal.test.ts`
Expected: FAIL, cannot resolve `./deal`.

- [ ] **Step 3: Implement `dueTriggers` and `dealYear` in `src/engine/deal.ts`, and `findSeed` in `test-utils.ts`**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/deal.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/deal.ts src/engine/deal.test.ts src/engine/test-utils.ts
git commit -m "feat: deal guaranteed and random cards per year"
```

---

### Task 8: Effects, choices and luck rolls

**Files:**
- Create: `src/engine/effects.ts`, `src/engine/resolve.ts`
- Test: `src/engine/resolve.test.ts`

**Interfaces:**
- Consumes: types, `applyWellbeingDelta`, `toVisible`, `draw`, `keyOf`.
- Produces: `applyEffect(s: GameState, e: Effect): GameState`; `type ChoiceResult = { cardId: string; choiceId: string; score: DecisionScore | null; roll: { hit: boolean; luck: number; expected: number } | null; message: Localized<string> | null }`; `resolveChoice(s: GameState, card: Card, choiceId: string): { state: GameState; result: ChoiceResult }`.

`applyEffect`: money fields add; if cash would drop below 0, cash becomes 0 and the remainder is added to pinjol. Wellbeing goes through `applyWellbeingDelta`. People fields clamp to 0..100, and `partner` is ignored while null. `setMarried: true` sets married, sets partner to 60 if null, and sets flag `just_married`. `addChild` adds a child and sets flag `just_child`. `setPlan` and `setInsured` set values. `setEmployed: false` stores lastIncome, zeroes monthlyIncome and sets flag `career_changed`; `setEmployed: true` restores lastIncome. `monthlyIncomeFactor` multiplies income. `monthlyLifestyle` adds. `setFlag` adds the flag. `startKpr` adds price to property, takes downPayment from cash, adds price minus downPayment to kpr, sets kprMonthly and flag `just_kpr`.

`resolveChoice`:
- Dilemma and feed cards: find the choice, or throw `Error(`Unknown choice ${choiceId} on ${card.id}`)`. Score = `choice.grade?.(toVisible(s)) ?? null`, computed before any effect. Apply `choice.effect(s)`. If the choice has a roll: `p` = `roll.p(state)` clamped to 0..1, hit = `draw(seed, keyOf(age, 'outcome', card.id)) < p`, apply the hit or miss outcome effect, and append luck entry `{ age, source: card.id, expected: p * hit.luck + (1 - p) * miss.luck, actual }`. Append a `DecisionRecord` when the score is not null. The message is the outcome copy for a roll, else `choice.result ?? null`.
- Luck cards: `choiceId` must be `'ok'` (throw otherwise). Same roll logic using `keyOf(age, 'luck', card.id)`; score null.

- [ ] **Step 1: Write the failing tests**

```ts
it('grades on the snapshot from before the effect', () => {
  const card = dilemma({ grade: (v) => (v.cash >= 10_000_000 ? 5 : 1), effect: () => ({ cash: -8_000_000 }) });
  const r = resolveChoice(deepFreeze(makeState({ fin: { ...makeState().fin, cash: 10_000_000 } })), card, 'a');
  expect(r.result.score).toBe(5);
  expect(r.state.decisions.at(-1)).toMatchObject({ cardId: card.id, choiceId: 'a', score: 5 });
});
it('records expected and actual luck for an outcome roll', () => {
  const seed = findSeed((x) => draw(x, keyOf(22, 'outcome', 'bet')) >= 0.35);
  const card = dilemma({ id: 'bet', roll: { p: () => 0.35, hit: outcome(20), miss: outcome(-10) } });
  const r = resolveChoice(makeState({ seed }), card, 'a');
  expect(r.result.roll).toMatchObject({ hit: false, luck: -10 });
  expect(r.state.luck.at(-1)?.expected).toBeCloseTo(0.5);
});
it('rolls luck cards on the luck stream with choice ok', () => {
  const r = resolveChoice(makeState(), luckCard({ id: 'health' }), 'ok');
  expect(r.result.score).toBeNull();
  expect(() => resolveChoice(makeState(), luckCard({ id: 'health' }), 'a')).toThrow();
});
it('throws on an unknown choice', () => {
  expect(() => resolveChoice(makeState(), dilemma({}), 'zzz')).toThrow('Unknown choice zzz');
});
it('turns overspending into pinjol', () => {
  const s = applyEffect(makeState({ fin: { ...makeState().fin, cash: 3_000_000 } }), { cash: -5_000_000 });
  expect(s.fin.cash).toBe(0);
  expect(s.fin.pinjol).toBe(2_000_000);
});
it('starts a KPR', () => {
  const s = applyEffect(makeState({ fin: { ...makeState().fin, cash: 100_000_000 } }), { startKpr: { price: 500_000_000, downPayment: 50_000_000, monthly: 4_000_000 } });
  expect(s.fin).toMatchObject({ property: 500_000_000, cash: 50_000_000, kpr: 450_000_000, kprMonthly: 4_000_000 });
  expect(s.flags.just_kpr).toBe(true);
});
```

Fixture builders in the test file, with both locales filled: `dilemma(opts: { id?: string; grade?: Choice['grade']; effect?: Choice['effect']; roll?: Roll })` returns a dilemma card (id defaults to `'d1'`, all four stages) with choice `'a'` carrying the given grade, effect (default `() => ({})`) and roll, and choice `'b'` with an empty effect and grade 3. `luckCard(opts: { id: string })` returns a luck card whose roll has p 0.5, hit luck -10 and miss luck 5, both with empty effects. `outcome(luck: number): Outcome` returns an outcome with an empty effect and that luck value.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/resolve.test.ts`
Expected: FAIL, cannot resolve `./resolve`.

- [ ] **Step 3: Implement `applyEffect` and `resolveChoice`**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/resolve.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/effects.ts src/engine/resolve.ts src/engine/resolve.test.ts
git commit -m "feat: resolve choices, outcome rolls and luck events"
```

---

### Task 9: Grades, percentiles, archetypes and the report

**Files:**
- Create: `src/engine/grading.ts`, `src/engine/percentile.ts`, `src/engine/archetype.ts`, `src/engine/report.ts`
- Test: `src/engine/report.test.ts`

**Interfaces:**
- Consumes: types, `netWorth`, `levelOf`, `startLuckPercentile`.
- Produces:
  - `averageScore(ds: readonly DecisionRecord[]): number | null`
  - `letterOf(avg: number | null): LetterGrade`. Thresholds: 4.6 A, 4.3 A-, 4.0 B+, 3.7 B, 3.4 B-, 3.1 C+, 2.8 C, 2.5 C-, 2.2 D+, 1.9 D, 1.6 D-, below that E (each is "at least"). `null` gives `'C'`.
  - `type QuantileTable = readonly number[]` (101 ascending values) and `percentileOf(x: number, t: QuantileTable): number`: linear interpolation between neighbours, 0 at or below `t[0]`, 100 at or above `t[100]`, rounded to an integer.
  - `luckScore(entries: readonly LuckEntry[]): number` = sum of (actual - expected).
  - `type ArchetypeKey = 'burnt_out' | 'rich_but_tired' | 'lucky_gambler' | 'unlucky_but_wise' | 'steady_compounder' | 'broke_but_happy' | 'sandwich_hero' | 'balanced' | 'getting_by'` and `archetypeOf(i: { burnoutYears: number; netWorthPct: number; avgWellbeing: number; luckPct: number; gradeAvg: number | null; supportsParents: boolean }): ArchetypeKey`. First match wins, with gradeAvg null read as 3.0: burnoutYears >= 5, burnt_out; netWorthPct >= 70 and avgWellbeing < 45, rich_but_tired; luckPct >= 80 and gradeAvg < 3.1, lucky_gambler; luckPct <= 20 and gradeAvg >= 3.7, unlucky_but_wise; gradeAvg >= 3.7 and netWorthPct >= 50 and avgWellbeing >= 50, steady_compounder; netWorthPct < 30 and avgWellbeing >= 60, broke_but_happy; supportsParents and gradeAvg >= 3.4, sandwich_hero; avgWellbeing >= 55 and netWorthPct >= 30, balanced; otherwise getting_by.
  - `type Report = { finalAge: number; netWorth: number; netWorthPct: number; wellbeingFinal: number; wellbeingLevel: WellbeingLevel; avgWellbeing: number; grade: LetterGrade; gradeAvg: number | null; luck: number; luckPct: number; startLuckPct: number; relationships: 'strong' | 'okay' | 'strained'; archetype: ArchetypeKey; best: DecisionRecord | null; worst: DecisionRecord | null; series: { age: number; netWorth: number; wellbeing: number }[] }`
  - `buildReport(s: GameState, tables: { netWorth: QuantileTable; luck: QuantileTable }): Report`. avgWellbeing is the rounded mean of history wellbeing. Relationships are the mean of family, friend and partner (when not null): 65 or more is strong, 40 or more is okay, below that strained. Best is the highest score and worst the lowest, ties going to the earliest; with one decision both are that decision; with none both are null. series comes from history.

- [ ] **Step 1: Write the failing tests**

```ts
const identity = Array.from({ length: 101 }, (_, i) => i);

it('converts averages to letters', () => {
  expect([4.6, 4.59, 3.7, 1.59].map(letterOf)).toEqual(['A', 'A-', 'B', 'E']);
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/report.test.ts`
Expected: FAIL, cannot resolve the new modules.

- [ ] **Step 3: Implement the four modules**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/report.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/grading.ts src/engine/percentile.ts src/engine/archetype.ts src/engine/report.ts src/engine/report.test.ts
git commit -m "feat: add grades, percentiles, archetypes and the report"
```

---

### Task 10: Content validation and sample cards

**Files:**
- Create: `src/engine/content-check.ts`, `src/content/sample.ts`
- Test: `src/content/content.test.ts`

**Interfaces:**
- Consumes: `Card`, `Trigger`, `oddsMultiplier`, `fomoFactor`, `toVisible`, `levelOf`.
- Produces: `validateContent(cards: readonly Card[]): string[]` (problems as messages, each naming the card id, or the trigger for an uncovered trigger; empty means valid) and `SAMPLE_CARDS: readonly Card[]`.

`validateContent` rules: ids are unique; every localized string (card copy, choice labels, notes, results, outcome copy) is non-empty in both `en` and `jaksel`; a dilemma has 2 or 3 choices and every one has a `grade`; a feed card has 1 or 2 choices; a luck card has a `roll` and no choices; a choice without a roll has a `result`; no copy contains an em dash (U+2014) or a double hyphen; every `Trigger` value is covered by at least one card's `triggers`.

Sample cards. In the grading column, `v` is the `VisibleState`, `em` is `v.emergencyMonths` and `pj` is `v.debt.pinjol`.

| id | kind, triggers or stages | Choices, effects | Grading |
|-|-|-|-|
| `money_plan` | dilemma; triggers first_salary, career_change, married, child, kpr; repeatable | `save_all`, `half_index`, `invest_most`, each `{ setPlan }` | pj > 0: 4, 2, 1. Else em < 3: 5, 3, 1. Else age < 45: 2, 4, 5. Else 3, 5, 4 |
| `recovery` | dilemma; trigger capek; repeatable | `leave` `{ cash: -monthlyIncome, wellbeing: 25 }`; `therapy` `{ cash: -6_000_000, wellbeing: 15 }`; `push_through` `{ wellbeing: -5, security: 5 }` | leave: em >= 1 ? 5 : 3; therapy 4; push_through 1 |
| `pinjol_payoff` | dilemma; trigger pinjol; repeatable | `pay_all` pays min(cash, pinjol); `pay_half` pays half of that, rounded; `later` `{}` | pay_all 5; pay_half 3; later: cash >= pj ? 1 : 2 |
| `insurance_offer` | dilemma; triggers first_job_insurance, family_insurance; repeatable; eligible when not insured | `buy` `{ setInsured: true, monthlyLifestyle: 400_000 }`; `skip` `{}` | married or children: buy 5, skip 1. Else buy 4, skip 3 |
| `japan_trip` | dilemma; early, building; not repeatable; weight 3 | `book` `{ cash: -18_000_000, wellbeing: 15, friend: 8 }`; `bali` `{ cash: -6_000_000, wellbeing: 8, friend: 3 }`; `skip` `{ wellbeing: -6, friend: -3 }` | pj > 0: 1, 2, 5. em >= 6: 4, 5, 3. em >= 3: 2, 5, 4. Else 1, 2, 5 |
| `kopi_bet` | dilemma; early, building; not repeatable; weight 2 | `invest` `{ cash: -10_000_000 }` with roll p 0.35, hit `{ cash: 25_000_000, wellbeing: 5 }` luck 20, miss `{ wellbeing: -4 }` luck -10; `pass` `{}` | share = 10_000_000 / max(v.netWorth, 1). invest: em >= 6 and share <= 0.10 ? 4 : (em < 3 or pj > 0 ? 1 : 3). pass: em >= 6 and share <= 0.10 ? 4 : 5 |
| `health_check` | luck; all stages; repeatable; weight 2 | roll p = 0.15 x `oddsMultiplier(level, 'bad')`. Hit: insured `{ cash: -2_500_000 }`, else family >= 60 `{ cash: -15_000_000 }`, else `{ cash: -25_000_000 }`, plus wellbeing -8, luck -25. Miss: `{ wellbeing: 2 }`, luck 5 | none |
| `friend_car` | feed; early, building, peak; repeatable; weight 3 | `scroll`: em >= 6 ? `{ wellbeing: -1 }` : `{ wellbeing: -Math.round(4 * fomoFactor(temperament)) }` | none |
| `restructuring` | luck; building, peak; repeatable; weight 1; eligible when employed | roll p = min(0.9, 0.3 x `oddsMultiplier(level, 'bad')` x (security < 50 ? 1.5 : 1)). Hit `{ setEmployed: false, wellbeing: -10 }` luck -40. Miss `{ security: 5 }` luck 8 | none |

Exact copy for the two approved mockup cards (other sample copy follows spec section 6.1 and is replaced in Plan 3):
- `japan_trip`. en: "Your group chat is booking Japan for April. Rp18 million each." Choices: "Book it. I've earned this." / "Go to Bali instead" (note "Rp6 million") / "Skip it and keep saving". jaksel: "Grup chat udah mau booking Jepang buat April. Rp18 jt per orang. Lo ikut gak?" Choices: "Gas, healing itu penting" / "Bali aja deh" (note "Rp6 jt") / "Skip dulu, mau nabung".
- `kopi_bet`. en: "Your friend is opening a kopi susu shop and needs Rp10 million from investors. Are you in?" Choices: "Put in Rp10 million" / "Wish them luck, keep my money". Hit: "The shop is packed every weekend. You get Rp25 million back." Miss: "The shop closed after 8 months." jaksel: "Temen lo mau buka kedai kopi susu, lagi nyari modal Rp10 jt. Lo masuk?" Choices: "Masuk, Rp10 jt" / "Support dari jauh aja". Hit: "Kedainya rame tiap weekend. Lo dapet balik Rp25 jt." Miss: "Kedainya tutup setelah 8 bulan."

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/content/content.test.ts`
Expected: FAIL, cannot resolve the new modules.

- [ ] **Step 3: Implement `validateContent` and `SAMPLE_CARDS`**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/content/content.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/content-check.ts src/content/sample.ts src/content/content.test.ts
git commit -m "feat: add content validation and sample cards"
```

---

### Task 11: The run

**Files:**
- Create: `src/engine/run.ts`
- Test: `src/engine/run.test.ts`

**Interfaces:**
- Consumes: `rollStart`, `initialState`, `dealYear`, `resolveChoice`, `ChoiceResult`, `economyTick`, `lifeTick`, `draw`, `netWorth`, `levelOf`, `toVisible`, `END_AGE`.
- Produces:
  - `type Run = { state: GameState; queue: string[]; year: string[]; last: ChoiceResult | null; finished: boolean }`
  - `createRun(seed: string, content: readonly Card[]): Run`: rollStart, then initialState, then dealYear; `queue` and `year` hold the dealt ids.
  - `currentCard(run: Run, content: readonly Card[]): Card | null`
  - `choose(run: Run, content: readonly Card[], choiceId: string): Run`: resolves the current card, shifts the queue, sets `last`. Throws when there is no current card.
  - `endYear(run: Run, content: readonly Card[]): Run`: throws while cards are queued or once finished. Applies `economyTick`, then `lifeTick` with `rnd = (k) => draw(seed, k)`, appends its luck entries, sets flag `career_changed` when the career changed, and pushes `{ age, netWorth, wellbeing, level, events: year }` to history. At `END_AGE` it sets `finished`; otherwise it adds 1 to age and deals the next year into `queue` and `year`.
  - `serialize(run: Run): string` and `deserialize(json: string): Run` (throws on a missing `state.seed` or a non-array `queue`).
  - `playToEnd(seed: string, content: readonly Card[], pick: (card: Card, v: VisibleState, run: Run) => string): Run`

- [ ] **Step 1: Write the failing tests**

```ts
const first = (card: Card) => card.choices?.[0]?.id ?? 'ok';

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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/run.test.ts`
Expected: FAIL, cannot resolve `./run`.

- [ ] **Step 3: Implement `src/engine/run.ts`**

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/run.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/run.ts src/engine/run.test.ts
git commit -m "feat: add the run lifecycle with save and restore"
```

---

### Task 12: Player styles, CLI, percentile tables and the public API

**Files:**
- Create: `src/engine/sim/policies.ts`, `scripts/percentiles.ts`, `scripts/sim.ts`, `src/engine/data/percentiles.json` (generated), `src/engine/index.ts`, `README.md`
- Test: `src/engine/sim/policies.test.ts`, `scripts/scripts.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `type Style = 'frugal' | 'balanced' | 'yolo' | 'random'` and `pickFor(style: Style): (card: Card, v: VisibleState, run: Run) => string`. Luck cards return `'ok'`. frugal picks the choice with the highest `effect(run.state).cash ?? 0` (ties go to the first). yolo picks the largest `wellbeing` gain (ties go to the lower cash). balanced picks the highest `grade(v)`, with ungraded choices counted as 0 and ties going to the first. random picks index `Math.floor(draw(seed, keyOf(age, 'policy', card.id)) * choices.length)`.
  - `buildTables(runs: readonly { netWorth: number; luck: number }[]): { netWorth: number[]; luck: number[] }` (exported from `src/engine/sim/policies.ts`): for each metric, sort ascending and take nearest-rank quantiles, `q[p] = sorted[Math.min(n - 1, Math.max(0, Math.ceil((p / 100) * n) - 1))]` for p from 0 to 100.
  - `scripts/percentiles.ts`: flag `--runs <n>` (default 20000). Plays seeds `pct-${i}`, cycling styles in the order frugal, balanced, yolo, random, and writes `src/engine/data/percentiles.json` as `{ "runs": n, "generatedAt": "<ISO timestamp>", "netWorth": [101 numbers], "luck": [101 numbers] }`.
  - `scripts/sim.ts`: flags `--seed` (default `demo`) and `--style` (default `balanced`). Prints one line per year, `Age 27 | Rp42.150.000 | oke | japan_trip:bali` (Rupiah with dot thousands separators, then the level and the `cardId:choiceId` pairs of that year), then `Grade: B+`, `Luck percentile: 62`, `Archetype: steady_compounder`, using the committed percentile tables.
  - `src/engine/index.ts` re-exports `createRun`, `currentCard`, `choose`, `endYear`, `serialize`, `deserialize`, `playToEnd`, `toVisible`, `buildReport`, `percentileOf`, `validateContent`, `rollStart`, `startLuckPercentile`, `levelOf`, `pickFor`, and all types.

- [ ] **Step 1: Write the failing tests**

```ts
// src/engine/sim/policies.test.ts
const japan = SAMPLE_CARDS.find((c) => c.id === 'japan_trip')!;
const run = createRun('pol', SAMPLE_CARDS);
const v = { ...toVisible(run.state), emergencyMonths: 4, debt: { kpr: 0, pinjol: 0, cardDebt: 0 } };

it('frugal skips the trip, yolo books it, balanced picks Bali', () => {
  expect(pickFor('frugal')(japan, v, run)).toBe('skip');
  expect(pickFor('yolo')(japan, v, run)).toBe('book');
  expect(pickFor('balanced')(japan, v, run)).toBe('bali');
});
it('random is deterministic per seed', () => {
  expect(pickFor('random')(japan, v, run)).toBe(pickFor('random')(japan, v, run));
});
it('builds 101 ascending quantiles spanning min to max', () => {
  const t = buildTables(Array.from({ length: 500 }, (_, i) => ({ netWorth: i * 1_000, luck: 250 - i })));
  expect(t.netWorth).toHaveLength(101);
  expect(t.netWorth[0]).toBe(0);
  expect(t.netWorth[100]).toBe(499_000);
  expect(t.luck.every((x, i, a) => i === 0 || a[i - 1]! <= x)).toBe(true);
});

// scripts/scripts.test.ts
it('plays a full run from the CLI', () => {
  const out = execSync('npx tsx scripts/sim.ts --seed demo --style balanced', { encoding: 'utf8' });
  expect(out).toContain('Age 60');
  expect(out).toMatch(/Archetype: [a-z_]+/);
}, 60_000);
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/sim scripts`
Expected: FAIL, cannot resolve `./policies` and `scripts/sim.ts`.

- [ ] **Step 3: Implement `policies.ts` and `scripts/percentiles.ts`, then generate the tables**

Run: `npm run percentiles -- --runs 2000`
Expected: `src/engine/data/percentiles.json` exists with 101 entries in `netWorth` and in `luck`. (Plan 3 regenerates it at 100,000 runs on the full content.)

- [ ] **Step 4: Implement `scripts/sim.ts`, `src/engine/index.ts` and a short README section (Engine: `npm test`, `npm run coverage`, `npm run sim -- --seed <s> --style <style>`, `npm run percentiles -- --runs <n>`)**

- [ ] **Step 5: Run the full verification**

Run: `npm run typecheck`, then `npm test`, then `npm run coverage`
Expected: no type errors, every test passes, and coverage for `src/engine/**` meets the 80% thresholds.

- [ ] **Step 6: Commit**

```bash
git add src/engine/sim scripts src/engine/data/percentiles.json src/engine/index.ts README.md
git commit -m "feat: add player styles, CLI simulator and percentile tables"
```
