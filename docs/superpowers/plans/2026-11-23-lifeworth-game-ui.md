# Lifeworth Game UI Implementation Plan (Plan 2 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the engine into a playable phone-first web game: welcome, birth lottery, cards rendered as phone moments, an outcome sheet that grades the decision apart from the luck, year recaps and the end report, in English and Jaksel, with Oren, Motion, the Dompet wallet sheet and autosave.

**Architecture:** Three layers, each depending only on the one below. `src/engine` stays pure and gains only a card `moment`, two exports and typed percentile tables. `src/app` is React-free logic: a pure screen state machine over the engine's `Run` (`flow.ts`), versioned saves (`save.ts`) and a Zustand vanilla store that autosaves and ignores stale taps (`store.ts`). `src/ui` is React 19: screens read the store through one provider, render copy from a typed bilingual string table, and animate through `LazyMotion`.

**Tech Stack:** Vite ^8.3.8, React ^19.3.1, TypeScript ~6.0.2 (strict), Zustand ^5.1.0, Motion ^14.14.0 (`motion/react`), @fontsource/nunito ^5.3.0, Vitest ^4.1.9 with two projects, jsdom ~29.1.1, Testing Library (react ^16.3.3, dom ^10.4.2, user-event ^14.6.13, jest-dom ^8.0.0). This machine runs Node 24.13; jsdom 30 and later need Node 24.15, so stay on 29.

**Spec:** `docs/superpowers/specs/2026-11-23-lifeworth-design.md`, with the approved mockup `docs/superpowers/specs/assets/2026-11-23-mockup-v3.html` (its numeric wellbeing in the top bar is superseded by the feeling).

**Plan series:** 1 Engine (done), 2 Game UI (this plan), 3 Content and tuning, 4 Share, PWA and release. Not in this plan: the share card, challenge links and their two report buttons, the PWA, Playwright and hosting (Plan 4); the full card set, tuning and per-choice grade explanations (Plan 3).

**Branch:** `feat/game-ui` from `main`, worked in place. No worktree: `node_modules` lives in this OneDrive folder (spec section 9) and a second copy is not worth it.

## Global Constraints

- Plan 1's engine constraints still hold for `src/engine`: pure, no React, DOM or Node imports, immutable, randomness only from `draw(seed, key)`.
- `src/app` imports no React and no DOM. `src/ui` calls engine functions only through `src/engine/index.ts` (tests may also use `src/engine/test-utils.ts` and `src/engine/rng.ts`).
- Never `Math.random`. New seeds come from `crypto.getRandomValues`.
- Before the report, wellbeing appears only as the heart plus a feeling word: Seger, Oke, Capek, Burnout (English: Great, Okay, Tired, Burnt out). No wellbeing number, relationship score or job security is rendered before the report.
- Every player-facing string exists in `en` and `jaksel`. No em dash and no double hyphen, no emoji, no real company names. Jaksel is written in its own voice, not translated, and the owner reviews it before merge.
- Type: Nunito 700, 800 and 900 only, self-hosted latin subset. Primary buttons uppercase with 0.06em letter spacing; everything else sentence case.
- Colour: the spec section 6 tokens with their exact hex values, plus the additions in Task 7. No gradients, no drop shadows (depth comes from a 4px bottom edge), 16px radius on buttons and tiles.
- Choices within a card render with identical markup and classes. Selection styling comes only from the checked state.
- AA contrast: text at least 4.5:1, large text (18.66px bold and up) at least 3:1, meaningful icons at least 3:1. Where the mockup's label colours fail (white on Pandan is 2.3:1), the Task 7 pairs win.
- Touch targets at least 44 by 44px. Every control is a native button, input or label. Visible focus is a 3px Telang outline with a 2px offset.
- Motion: only `m.*` components under `LazyMotion features={domAnimation} strict` inside `MotionConfig reducedMotion="user"`. Animations answer a tap; the coin flip is the one showpiece. Under reduced motion every animation starts at its end state (`initial={false}`, no delays, count-ups jump).
- Layout: one column, max-width 480px, 16px side padding, no horizontal scroll from 320px wide up.
- Zustand v5: select single fields (`useApp((s) => s.game)`). Never return a new object or array from a selector; v5 loops on unstable selector results.
- No `console.log`. Conventional commits (`feat:`, `test:`, `chore:`, `docs:`), no attribution trailer.

## Review Focus

1. Refresh at any moment, including while the outcome sheet is open and right after the last card of a year: the game reopens on the same screen with the same sheet, and the choice is neither lost nor resolved twice. Pinned in Task 5 and Task 15.
2. A bad save (truncated JSON, an older `SAVE_VERSION`, a run whose queued card id no longer exists after a content update, localStorage that throws as in Safari private mode): the game opens on the welcome screen, never crashes, and the bad save is deleted. Pinned in Task 4, Task 5 and Task 15.
3. Rapid double taps on Choose, Continue or Next: exactly one choice resolves and no card is skipped. Pinned in Task 5 (store guards) and Task 7 (the confirm button locks).
4. Extreme values at 320px wide (net worth in the trillions or deeply negative from pinjol, a 20-character nickname, the longest Jaksel line): money stays short, for example `-Rp2,6 M`, and nothing overflows. Pinned in Task 6 (formatting) and Task 16 (manual 320px pass).
5. Keyboard-only play: every card can be answered and every sheet opened and closed with Tab, Space, Enter and Escape, with focus returned to the opener. Pinned in Task 7, Task 9 and Task 15.

---

### Task 1: Scaffold the app and the test projects

**Files:**
- Create: `index.html`, `vite.config.ts`, `tsconfig.app.json`, `src/main.tsx`, `src/ui/App.tsx` (a heading only; Task 15 replaces it), `src/ui/motion.tsx`, `src/ui/test/setup.ts`
- Modify: `package.json`, `tsconfig.json`, `vitest.config.ts`
- Test: `src/ui/test/setup.test.tsx`

**Interfaces:**
- Produces: `MotionRoot({ children }: { children: ReactNode }): JSX.Element` in `src/ui/motion.tsx`, which renders `MotionConfig reducedMotion="user"` around `LazyMotion features={domAnimation} strict`. Vitest projects `logic` (node) and `ui` (jsdom). npm scripts `dev`, `build`, `preview`, `typecheck`.

- [ ] **Step 1: Branch and install**

```bash
git checkout -b feat/game-ui
git add docs/superpowers/plans/2026-11-23-lifeworth-game-ui.md
git commit -m "docs: add game UI implementation plan"
npm install react@^19.3.1 react-dom@^19.3.1 motion@^14.14.0 zustand@^5.1.0 @fontsource/nunito@^5.3.0
npm install -D vite@^8.3.8 @vitejs/plugin-react@^6.3.0 @types/react@^19.3.0 @types/react-dom@^19.3.0 jsdom@~29.1.1 @testing-library/react@^16.3.3 @testing-library/dom@^10.4.2 @testing-library/user-event@^14.6.13 @testing-library/jest-dom@^8.0.0
```

Expected: installs without peer errors.

- [ ] **Step 2: Configure**

`package.json` scripts: add `dev` = `vite`, `build` = `npm run typecheck && vite build`, `preview` = `vite preview`; change `typecheck` to `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.app.json`.

`tsconfig.json`: change `include` to `["src/engine", "src/content", "src/app", "scripts"]`. It keeps no DOM lib, so the engine and the app logic cannot touch the DOM.

`tsconfig.app.json`: `extends: "./tsconfig.json"`, compilerOptions `lib: ["ES2022", "DOM", "DOM.Iterable"]`, `jsx: "react-jsx"`, `types: ["vite/client"]`, and `include: ["src"]`.

`vite.config.ts`: `defineConfig({ plugins: [react()] })`.

`vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      { extends: true, test: { name: 'logic', environment: 'node',
        include: ['src/engine/**/*.test.ts', 'src/content/**/*.test.ts', 'src/app/**/*.test.ts', 'scripts/**/*.test.ts'] } },
      { extends: true, test: { name: 'ui', environment: 'jsdom',
        include: ['src/ui/**/*.test.{ts,tsx}'], setupFiles: ['src/ui/test/setup.ts'] } },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/app/**', 'src/ui/**'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/test-utils.ts', 'src/ui/test/**', 'src/engine/data/**'],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});
```

`index.html` at the repo root: `lang="en"`, charset, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="theme-color" content="#FFFFFF">`, `<meta name="description" content="Live a whole Indonesian life in ten minutes, then see what was you and what was luck.">`, title `Lifeworth`, `<div id="root"></div>`, `<script type="module" src="/src/main.tsx"></script>`.

`src/main.tsx`: imports `@fontsource/nunito/latin-700.css`, `latin-800.css` and `latin-900.css`, then renders `<StrictMode><App /></StrictMode>` into `#root` (throw if `#root` is missing). `src/ui/App.tsx` renders `<MotionRoot><main className="app"><h1>Lifeworth</h1></main></MotionRoot>` for now.

`src/ui/test/setup.ts`: imports `@testing-library/jest-dom/vitest`; sets `MotionGlobalConfig.skipAnimations = true` (from `motion/react`); installs a `window.matchMedia` stub (jsdom has none) that returns `matches: false` with no-op listener methods; runs `cleanup()` and `localStorage.clear()` in `afterEach` (Vitest globals are off, so Testing Library cannot register its own cleanup).

- [ ] **Step 3: Write the failing test**

```tsx
// src/ui/test/setup.test.tsx
import { render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { expect, it } from 'vitest';
import { MotionRoot } from '../motion';

it('renders into jsdom with jest-dom matchers and instant motion', () => {
  render(<MotionRoot><button type="button">Mulai</button></MotionRoot>);
  expect(screen.getByRole('button', { name: 'Mulai' })).toBeInTheDocument();
  expect(MotionGlobalConfig.skipAnimations).toBe(true);
  expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run src/ui/test/setup.test.tsx`
Expected: FAIL, cannot resolve `../motion`.

- [ ] **Step 5: Implement `src/ui/motion.tsx`**

- [ ] **Step 6: Verify everything**

Run: `npm test`, then `npm run typecheck`, then `npm run build`
Expected: the 73 engine tests and the new UI test pass in projects `logic` and `ui`; no type errors; `dist/` holds `index.html`, one JS entry and three `nunito-latin-*-normal.woff2` files.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.app.json vite.config.ts vitest.config.ts index.html src/main.tsx src/ui
git commit -m "chore: scaffold the Vite and React app with UI test projects"
```

---

### Task 2: Engine and content hooks for the UI

**Files:**
- Modify: `src/engine/types.ts`, `src/engine/content-check.ts`, `src/engine/index.ts`, `src/content/sample.ts`, `src/content/content.test.ts`
- Create: `src/engine/tables.ts`, `src/content/index.ts`, `src/content/titles.ts`
- Test: `src/engine/tables.test.ts`, `src/content/content.test.ts`, `src/content/titles.test.ts`

**Interfaces:**
- Produces:
  - `type MomentKind = 'story' | 'chat' | 'bank' | 'email' | 'notif'`, `interface Moment { kind: MomentKind; from: string; copy: Localized<string> }`, and `Card.moment?: Moment`: the phone moment a card renders as (spec 5.5). `from` is a name or handle, the same in both languages. The engine ignores it.
  - `validateContent` also reports `${card.id}: empty moment sender` when `from` is blank, and moment copy problems through the existing `textProblems(card.id, moment.copy, 'moment')`.
  - `PERCENTILE_TABLES: Readonly<{ netWorth: QuantileTable; luck: QuantileTable }>` in `src/engine/tables.ts`, read from `./data/percentiles.json` by a default JSON import. `src/engine/index.ts` re-exports it and `END_AGE`.
  - `CONTENT: readonly Card[]` in `src/content/index.ts`, equal to `SAMPLE_CARDS` until Plan 3.
  - `jobTitle(titleKey: string): string` in `src/content/titles.ts`. It parses the engine's `${education}_${level}`; a level past the ladder gets the last title; anything unparseable gets `Staff`. One text for both languages, because Jakarta offices use English titles.

| Education | Level 0 to 6 |
|-|-|
| highschool | Admin staff, Senior admin staff, Team lead, Supervisor, Assistant manager, Manager, Senior manager |
| diploma | Junior staff, Staff, Senior staff, Supervisor, Assistant manager, Manager, Senior manager |
| degree | Management trainee, Associate, Senior associate, Assistant manager, Manager, Senior manager, Head of department |

Sample moments (copy needs owner review; Plan 3 rewrites all content):

| Card | kind | from | en | jaksel |
|-|-|-|-|-|
| money_plan | bank | m-Banking | Salary received. | Gaji udah masuk. |
| japan_trip | story | dindaaa.r | posted a story from Kyoto | upload story dari Kyoto |
| kopi_bet | chat | Bima | Bro, got a minute? Business idea. | Bro, ada waktu bentar? Mau ngomongin bisnis. |
| health_check | notif | Klinik Sehat | Your check-up results are ready. | Hasil check-up lo udah keluar. |
| friend_car | story | raka.wijaya | posted a new story | upload story baru |
| restructuring | email | HR | Invitation: Organizational alignment | Undangan: Organizational alignment |

- [ ] **Step 1: Write the failing tests**

```ts
// src/engine/tables.test.ts
it('ships 101 ascending quantiles for net worth and luck', () => {
  for (const t of [PERCENTILE_TABLES.netWorth, PERCENTILE_TABLES.luck]) {
    expect(t).toHaveLength(101);
    expect(t.every((x, i) => i === 0 || t[i - 1]! <= x)).toBe(true);
  }
});

// src/content/content.test.ts (add)
it('flags a moment with no sender or missing Jaksel copy', () => {
  const japan = SAMPLE_CARDS.find((c) => c.id === 'japan_trip')!;
  const others = SAMPLE_CARDS.filter((c) => c.id !== 'japan_trip');
  const noFrom = { ...japan, moment: { ...japan.moment!, from: ' ' } };
  const noJaksel = { ...japan, moment: { ...japan.moment!, copy: { en: 'posted a story', jaksel: '' } } };
  expect(validateContent([...others, noFrom]).join('\n')).toContain('japan_trip: empty moment sender');
  expect(validateContent([...others, noJaksel]).join('\n')).toContain('japan_trip: empty moment in jaksel');
});
it('exports CONTENT as a valid set with moments on six cards', () => {
  expect(validateContent(CONTENT)).toEqual([]);
  expect(CONTENT.filter((c) => c.moment).map((c) => c.id).sort())
    .toEqual(['friend_car', 'health_check', 'japan_trip', 'kopi_bet', 'money_plan', 'restructuring']);
});

// src/content/titles.test.ts
it('names each rung and caps at the top of the ladder', () => {
  expect(jobTitle('degree_0')).toBe('Management trainee');
  expect(jobTitle('diploma_3')).toBe('Supervisor');
  expect(jobTitle('highschool_9')).toBe('Senior manager');
  expect(jobTitle('nonsense')).toBe('Staff');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/engine/tables.test.ts src/content`
Expected: FAIL, cannot resolve `./tables`, `./index` and `./titles`.

- [ ] **Step 3: Implement the type, the validation, `tables.ts`, the index exports, `CONTENT`, `jobTitle` and the six sample moments**

- [ ] **Step 4: Run to verify they pass**

Run: `npm test` then `npm run typecheck`
Expected: all tests pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/engine src/content
git commit -m "feat: add card moments, percentile tables and job titles for the UI"
```

---

### Task 3: The screen flow

**Files:**
- Create: `src/app/flow.ts`, `src/app/test-utils.ts`
- Test: `src/app/flow.test.ts`

**Interfaces:**
- Consumes: `createRun`, `currentCard`, `choose`, `endYear`, `toVisible`, `END_AGE` and types from `src/engine`; `CONTENT` from `src/content`.
- Produces (`src/app/flow.ts`):

```ts
export type CareerEvent = 'promoted' | 'fired' | 'rehired';
export interface Recap {
  fromAge: number; toAge: number;           // inclusive span of the years just closed
  netWorth: number; netWorthChange: number; // at the end of toAge; change since the previous recap (or the start)
  employed: boolean; titleKey: string; monthlyIncome: number;
  level: WellbeingLevel;                    // the feeling at the end of toAge
  event: CareerEvent | null;                // an event always ends the span, so it belongs to toAge
}
export type Screen =
  | { name: 'lottery' }
  | { name: 'card' }
  | { name: 'outcome'; before: VisibleState } // snapshot taken just before the choice
  | { name: 'recap'; recap: Recap }
  | { name: 'report' };
export interface Game { run: Run; screen: Screen; startWorth: number }
```

  - `startGame(seed: string, content: readonly Card[]): Game`: a new run on the `lottery` screen; `startWorth` is `toVisible(run.state).netWorth`.
  - `leaveLottery(game, content): Game`, `pickChoice(game, content, choiceId: string): Game`, `leaveOutcome(game, content): Game`, `leaveRecap(game, content): Game`. Each throws `Error('<name>: wrong screen')` unless the game is on its screen (`lottery`, `card`, `outcome`, `recap`). `pickChoice` snapshots `toVisible(run.state)` into `before`, calls `choose`, and shows `outcome`. The others go to `card` when `currentCard(run)` exists, to `report` from a recap when `run.finished`, and otherwise to `closeYears`. Only `closeYears` calls `endYear`, and it is only reached after the outcome sheet was left, so `run.last` is always read before `endYear` clears it (Plan 1 carry-forward).
  - `closeYears(game, content): Game`: closes years until there is something to show, so quiet years fast-forward into one recap (spec 5.1):

```
prev = run.state.history.at(-1)?.netWorth ?? game.startWorth; from = run.state.age
repeat: before = run.state.career; run = endYear(run, content); event = careerEvent(before, run.state.career)
until run.finished or run.queue.length > 0 or event !== null
last = run.state.history.at(-1)
recap = { fromAge: from, toAge: last.age, netWorth: last.netWorth, netWorthChange: last.netWorth - prev,
          employed, titleKey and monthlyIncome from run.state.career, level: last.level, event }
```

  - `careerEvent(before: Career, after: Career): CareerEvent | null`: `rehired` when not employed then employed, `fired` when employed then not, `promoted` when `after.level > before.level`, else `null`.
  - `shownCard(game, content): Card | null`: the current card on `card`, the card of `run.last` on `outcome`, otherwise `null`.
- Produces (`src/app/test-utils.ts`, tests only): `firstChoiceId(card: Card): string` (`'ok'` for luck cards, else the first choice id); `advance(game, content): Game` (one step taking the first choice, throws on `report`); `playUntil(game, content, done: (g: Game) => boolean, limit = 1000): Game` (returns the first game, starting with the one passed in, for which `done` holds; throws `playUntil: condition never met` if it reaches the report or `limit` steps first); `atCard(seed, content, cardId, patch?: (s: GameState) => GameState): Game` (a fresh game parked on the `card` screen with `run.queue = [cardId]` and the state patched).

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/flow.test.ts
const SEED = 'flow-demo';

it('starts on the lottery with the starting net worth', () => {
  const g = startGame(SEED, CONTENT);
  expect(g.screen).toEqual({ name: 'lottery' });
  expect(g.startWorth).toBe(toVisible(g.run.state).netWorth);
});
it('leaves the lottery for the guaranteed money plan', () => {
  const g = leaveLottery(startGame(SEED, CONTENT), CONTENT);
  expect(g.screen).toEqual({ name: 'card' });
  expect(shownCard(g, CONTENT)?.id).toBe('money_plan');
});
it('shows the outcome before the year closes, keeping run.last', () => {
  let g = leaveLottery(startGame(SEED, CONTENT), CONTENT);
  const worth = toVisible(g.run.state).netWorth;
  g = pickChoice(g, CONTENT, 'half_index');
  expect(g.screen).toMatchObject({ name: 'outcome', before: { netWorth: worth } });
  expect(g.run.last?.choiceId).toBe('half_index');
  expect(g.run.state.history).toHaveLength(0);
  expect(shownCard(g, CONTENT)?.id).toBe('money_plan');
});
it('refuses actions on the wrong screen', () => {
  const g = startGame(SEED, CONTENT);
  expect(() => pickChoice(g, CONTENT, 'save_all')).toThrow('wrong screen');
  expect(() => leaveOutcome(g, CONTENT)).toThrow('wrong screen');
  expect(() => leaveRecap(g, CONTENT)).toThrow('wrong screen');
});
it('fast-forwards quiet years into one recap that stops before the next card or event', () => {
  const guaranteedOnly = CONTENT.filter((c) => c.triggers?.length);
  const g = playUntil(startGame(SEED, guaranteedOnly), guaranteedOnly,
    (x) => x.screen.name === 'recap' && x.screen.recap.toAge > x.screen.recap.fromAge);
  const { recap } = g.screen as Extract<Screen, { name: 'recap' }>;
  expect(recap.toAge).toBe(g.run.state.history.at(-1)!.age);
  expect(g.run.finished || g.run.queue.length > 0 || recap.event !== null).toBe(true);
});
it('plays a whole life, and the recaps add up to the net worth change', () => {
  const recaps: Recap[] = [];
  let g = startGame(SEED, CONTENT);
  while (g.screen.name !== 'report') {
    if (g.screen.name === 'recap') recaps.push(g.screen.recap);
    g = advance(g, CONTENT);
  }
  const s = g.run.state;
  expect(s.history).toHaveLength(END_AGE - s.start.startAge + 1);
  expect(recaps.at(-1)!.toAge).toBe(END_AGE);
  expect(recaps.reduce((sum, r) => sum + r.netWorthChange, 0)).toBe(toVisible(s).netWorth - g.startWorth);
});
it('names career changes between two years', () => {
  const c = makeState().career;
  expect(careerEvent(c, { ...c, level: c.level + 1 })).toBe('promoted');
  expect(careerEvent(c, { ...c, employed: false })).toBe('fired');
  expect(careerEvent({ ...c, employed: false }, c)).toBe('rehired');
  expect(careerEvent(c, c)).toBeNull();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/app/flow.test.ts`
Expected: FAIL, cannot resolve `./flow`.

- [ ] **Step 3: Implement `src/app/flow.ts` and `src/app/test-utils.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/app` then `npm run typecheck`
Expected: 7 tests pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app
git commit -m "feat: add the screen flow over the engine run"
```

---

### Task 4: Versioned saves and seeds

**Files:**
- Create: `src/app/save.ts`, `src/app/seed.ts`
- Test: `src/app/save.test.ts`, `src/app/seed.test.ts`

**Interfaces:**
- Consumes: `Game`, `Screen` from Task 3; `serialize`, `deserialize` from `src/engine`.
- Produces (`src/app/save.ts`):
  - `SAVE_KEY = 'lifeworth.save'`, `SAVE_VERSION = 1`, `NICKNAME_MAX = 20`.
  - `interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }`
  - `interface Saved { locale: Locale; nickname: string; game: Game | null }`
  - `encodeSave(saved: Saved): string` writes `{ "v": 1, "locale", "nickname", "game": null | { "run": serialize(run), "screen", "startWorth" } }`. The run is stored as the engine's own string so `deserialize` validates it.
  - `decodeSave(raw: string, content: readonly Card[]): Saved | null` returns `null` when any of these fail: valid JSON; `v === SAVE_VERSION`; `locale` is `en` or `jaksel`; `nickname` is a string; `game` is null, or `deserialize(game.run)` succeeds, every id in `run.queue` and `run.last?.cardId` exists in `content`, `startWorth` is a number, and the screen fits the run (`lottery` and `card` need an unfinished run and `card` a non-empty queue; `outcome` needs `run.last` and a `before` object with a numeric `netWorth`; `recap` needs numeric `fromAge`, `toAge`, `netWorth` and `netWorthChange`; `report` needs `run.finished`). The nickname passes through `cleanNickname`.
  - `cleanNickname(raw: string): string` removes control characters (U+0000 to U+001F and U+007F) and cuts to `NICKNAME_MAX`. It does not trim; trimming happens when a run starts.
  - `readSave(store, content): Saved | null` never throws; it deletes a stored value it cannot decode.
  - `writeSave(store, saved): void` never throws (a full or blocked storage just means no autosave).
  - `memoryStore(initial?: Readonly<Record<string, string>>): KeyValueStore`.
- Produces (`src/app/seed.ts`): `newSeed(fill: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string`, ten characters, each `ALPHABET[byte & 31]` with `ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'` (no l, o, 0 or 1, so a seed survives being read aloud).

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/save.test.ts
const SEED = 'save-demo';
const at = (name: Screen['name']): Game => playUntil(startGame(SEED, CONTENT), CONTENT, (g) => g.screen.name === name);

it('round-trips every screen', () => {
  for (const name of ['lottery', 'card', 'outcome', 'recap', 'report'] as const) {
    const saved: Saved = { locale: 'jaksel', nickname: 'Raka', game: at(name) };
    expect(decodeSave(encodeSave(saved), CONTENT)).toEqual(saved);
  }
});
it('rejects anything it cannot trust', () => {
  const good = JSON.parse(encodeSave({ locale: 'en', nickname: '', game: at('card') }));
  const bad = [
    '{"v":1,"locale":"en"',
    JSON.stringify({ ...good, v: 0 }),
    JSON.stringify({ ...good, locale: 'fr' }),
    JSON.stringify({ ...good, game: { ...good.game, run: '{}' } }),
    JSON.stringify({ ...good, game: { ...good.game, screen: { name: 'outcome', before: null } } }),
    JSON.stringify({ ...good, game: { ...good.game, screen: { name: 'report' } } }),
  ];
  for (const raw of bad) expect(decodeSave(raw, CONTENT)).toBeNull();
});
it('rejects a save whose queued card no longer exists', () => {
  const raw = encodeSave({ locale: 'en', nickname: '', game: at('card') });
  expect(decodeSave(raw, CONTENT.filter((c) => c.id !== 'money_plan'))).toBeNull();
});
it('cleans the nickname on load', () => {
  const raw = encodeSave({ locale: 'en', nickname: `Raka\u0007${'x'.repeat(30)}`, game: null });
  expect(decodeSave(raw, CONTENT)?.nickname).toBe(`Raka${'x'.repeat(16)}`);
});
it('deletes an unreadable save and never throws on a broken store', () => {
  const store = memoryStore({ [SAVE_KEY]: 'not json' });
  expect(readSave(store, CONTENT)).toBeNull();
  expect(store.getItem(SAVE_KEY)).toBeNull();
  const fail = (): never => { throw new Error('denied'); };
  const broken: KeyValueStore = { getItem: fail, setItem: fail, removeItem: fail };
  expect(readSave(broken, CONTENT)).toBeNull();
  expect(() => writeSave(broken, { locale: 'en', nickname: '', game: null })).not.toThrow();
});

// src/app/seed.test.ts
it('makes ten-character seeds from an unambiguous alphabet', () => {
  expect(newSeed()).toMatch(/^[a-km-np-z2-9]{10}$/);
  expect(newSeed()).not.toBe(newSeed());
});
it('maps bytes to the alphabet', () => {
  expect(newSeed((b) => b.fill(0))).toBe('aaaaaaaaaa');
  expect(newSeed((b) => b.fill(255))).toBe('9999999999');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/app/save.test.ts src/app/seed.test.ts`
Expected: FAIL, cannot resolve `./save` and `./seed`.

- [ ] **Step 3: Implement `src/app/save.ts` and `src/app/seed.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/app` then `npm run typecheck`
Expected: all `src/app` tests pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app
git commit -m "feat: add versioned saves and random seeds"
```

---

### Task 5: The app store

**Files:**
- Create: `src/app/store.ts`
- Test: `src/app/store.test.ts`

**Interfaces:**
- Consumes: Task 3 flow functions (import them as `* as flow`, since the actions share their names) and Task 4 save functions.
- Produces:

```ts
export type Panel = 'wallet' | 'menu';
export interface AppState {
  content: readonly Card[]; locale: Locale; nickname: string;
  game: Game | null; panel: Panel | null; failed: boolean;
}
export interface AppActions {
  setLocale(locale: Locale): void; setNickname(raw: string): void;
  start(): void; leaveLottery(): void; pick(choiceId: string): void; leaveOutcome(): void; leaveRecap(): void;
  openPanel(panel: Panel): void; closePanel(): void; quit(): void;
}
export type AppStore = StoreApi<AppState & AppActions>;
export interface StoreDeps { content: readonly Card[]; storage: KeyValueStore; newSeed: () => string }
export function createAppStore(deps: StoreDeps): AppStore;
```

  - Built with `createStore` from `zustand/vanilla`. Starts from `readSave(storage, content)`, or `{ locale: 'en', nickname: '', game: null }`; `panel` null and `failed` false.
  - Subscribes once and calls `writeSave` whenever `locale`, `nickname` or `game` changes by reference. Panel changes are not saved.
  - Each game action acts only when the game is on its screen (`start` only when `game` is null, `leaveLottery` on `lottery`, `pick` on `card`, `leaveOutcome` on `outcome`, `leaveRecap` on `recap`) and otherwise does nothing. This guard is what makes a double tap harmless.
  - Each game action catches any error from the flow, sets `failed: true` and leaves `game` as it was.
  - `start` trims the nickname and uses `deps.newSeed()`. `setNickname` stores `cleanNickname(raw)`. `quit` sets `game: null, panel: null, failed: false` and keeps the locale and nickname.

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/store.test.ts
const deps = (storage: KeyValueStore = memoryStore(), content: readonly Card[] = CONTENT): StoreDeps =>
  ({ content, storage, newSeed: () => 'store-demo' });

it('starts fresh, then saves a new run under the save key', () => {
  const storage = memoryStore();
  const store = createAppStore(deps(storage));
  const s = () => store.getState();
  expect(s().game).toBeNull();
  s().setNickname('  Raka  ');
  s().start();
  expect(s().game?.screen).toEqual({ name: 'lottery' });
  expect(s().game?.run.state.seed).toBe('store-demo');
  expect(s().nickname).toBe('Raka');
  expect(JSON.parse(storage.getItem(SAVE_KEY)!).v).toBe(SAVE_VERSION);
});
it('reopens the same outcome sheet after a refresh', () => {
  const storage = memoryStore();
  const a = createAppStore(deps(storage));
  a.getState().start(); a.getState().leaveLottery(); a.getState().pick('half_index');
  const b = createAppStore(deps(storage));
  expect(b.getState().game).toEqual(a.getState().game);
  expect(b.getState().game?.run.last?.choiceId).toBe('half_index');
});
it('ignores a second tap', () => {
  const store = createAppStore(deps());
  const s = () => store.getState();
  s().start(); s().leaveLottery(); s().pick('half_index'); s().pick('save_all');
  expect(s().game?.run.state.decisions).toHaveLength(1);
  expect(s().game?.run.last?.choiceId).toBe('half_index');
  s().leaveOutcome(); s().leaveOutcome();
  expect(s().game?.screen.name).toBe('card');
  expect(shownCard(s().game!, CONTENT)?.id).toBe('insurance_offer');
});
it('opens on the welcome screen and deletes a corrupt save', () => {
  const storage = memoryStore({ [SAVE_KEY]: '{"v":1,' });
  expect(createAppStore(deps(storage)).getState().game).toBeNull();
  expect(storage.getItem(SAVE_KEY)).toBeNull();
});
it('marks the run failed instead of throwing when a card breaks, and quit recovers', () => {
  const broken = CONTENT.map((c) => (c.id === 'money_plan'
    ? { ...c, choices: c.choices!.map((ch) => ({ ...ch, effect: () => { throw new Error('bad card'); } })) }
    : c));
  const store = createAppStore(deps(memoryStore(), broken));
  const s = () => store.getState();
  s().setLocale('jaksel'); s().start(); s().leaveLottery();
  expect(() => s().pick('save_all')).not.toThrow();
  expect(s().failed).toBe(true);
  expect(s().game?.screen.name).toBe('card');
  s().quit();
  expect(s()).toMatchObject({ game: null, failed: false, locale: 'jaksel' });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/app/store.test.ts`
Expected: FAIL, cannot resolve `./store`.

- [ ] **Step 3: Implement `src/app/store.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/app` then `npm run typecheck`
Expected: all `src/app` tests pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app
git commit -m "feat: add the app store with autosave and tap guards"
```

---

### Task 6: Money formatting and the bilingual UI copy

**Files:**
- Create: `src/ui/i18n/format.ts`, `src/ui/i18n/strings.ts`
- Test: `src/ui/i18n/format.test.ts`, `src/ui/i18n/strings.test.ts`

**Interfaces:**
- Consumes: engine types; `CareerEvent` from `src/app/flow.ts`.
- Produces (`format.ts`):
  - `formatRupiah(n: number, locale: Locale): string`: exact whole Rupiah, `en` with comma groups (`Rp8,500,000`), `jaksel` with dot groups (`Rp8.500.000`), a leading `-` for negatives.
  - `formatShort(n: number, locale: Locale): string`: units `en` K, M, B, T joined with no space; `jaksel` rb, jt, M, T joined with one space. Take the largest unit not above `|n|`; show one decimal below 10 (dropping a trailing zero) and a whole number from 10 up; when rounding reaches 1000, move up a unit. The decimal mark is `.` in `en` and `,` in `jaksel`. Below 1,000 the plain number. A leading `-` for negatives.
  - `formatDelta(n: number, locale: Locale): string`: `formatShort` with a leading `+` when positive.
  - `formatMonths(m: number, locale: Locale): string`: at most one decimal, with the locale's decimal mark.
  - `rankBand(pct: number): string`: `Top ${max(1, 100 - pct)}%` from 50 up, else `Bottom ${max(1, pct)}%`. The same words in both languages; Jaksel says top and bottom too.
- Produces (`strings.ts`): `interface Strings` and `STRINGS: Readonly<Record<Locale, Strings>>`. The groups and keys are exactly the tables below; `{x}` marks a parameter. Parameters named `age`, `from`, `to`, `n`, `years`, `avg` and `final` are numbers, `hasPinjol` and `hasFamily` are booleans, the rest are preformatted strings. Keyed values are records: `feeling: Record<WellbeingLevel, string>`, `lottery.familyValue: Record<FamilyMoney, string>`, `lottery.educationValue: Record<Education, string>`, `lottery.parentsValue: { yes; no }`, `lottery.temperamentValue: Record<Temperament, string>`, `card.title: Record<CardKind, (age: number) => string>`, `card.warning: { capek; burnout }`, `wallet.planValue: Record<MoneyPlan | 'none', string>`, `outcome.score: Record<DecisionScore, string>`, `outcome.luck: { badFair; badRisky; goodFair; goodRisky }`, `recap.event: Record<CareerEvent, string>`, `report.archetype: Record<ArchetypeKey, string>`, `report.tile: { netWorth; wellbeing; decisions; luck }`, `report.relationships: Record<Report['relationships'], string>`.

The Jaksel column is a draft for the owner to review before merge.

**common, feeling**

| Key | en | jaksel |
|-|-|-|
| common.continue | Continue | Lanjut |
| common.close | Close | Tutup |
| feeling.seger / oke / capek / burnout | Great / Okay / Tired / Burnt out | Seger / Oke / Capek / Burnout |

**welcome, lottery**

| Key | en | jaksel |
|-|-|-|
| welcome.tagline | One whole life in ten minutes. Then see what was you and what was luck. | Satu hidup, sepuluh menit. Abis itu keliatan, mana yang keputusan lo, mana yang cuma hoki. |
| welcome.language | Language | Bahasa |
| welcome.nickname | Nickname (optional) | Nickname (opsional) |
| welcome.nicknameHint | Only shown on your share card. | Cuma muncul di share card lo. |
| welcome.start | Start my life | Mulai hidup |
| welcome.disclaimer | A game. Real life is messier, and none of this is financial advice. | Ini cuma game. Hidup aslinya lebih ribet, dan ini bukan saran keuangan. |
| lottery.title | Your starting line | Garis start lo |
| lottery.sub | None of this was your choice. | Gak ada yang lo pilih di sini. |
| lottery.family | Family money | Duit keluarga |
| lottery.familyValue poor / middle / rich | Tight / Comfortable / Well off | Pas-pasan / Cukupan / Tajir |
| lottery.education | Education | Pendidikan |
| lottery.educationValue highschool / diploma / degree | High school / Diploma / Degree | SMA / D3 / S1 |
| lottery.parents | Supporting parents | Nanggung ortu |
| lottery.parentsValue yes / no | Yes, every month / No | Iya, tiap bulan / Nggak |
| lottery.temperament | Temperament | Bawaan |
| lottery.temperamentValue anxious / impulsive / steady | Anxious / Impulsive / Steady | Overthinker / Impulsif / Kalem |
| lottery.firstJob(age) | First job at {age} | Kerja pertama umur {age} |
| lottery.luck(band) | {band} of starts. | {band} dari semua start. |
| lottery.go | Get to work | Mulai kerja |

**card, topBar, wallet, menu**

| Key | en | jaksel |
|-|-|-|
| card.title.dilemma(age) | Age {age}. Your call. | Umur {age}. Pilih langkah lo. |
| card.title.luck(age) | Age {age}. Life happens. | Umur {age}. Namanya juga hidup. |
| card.title.feed(age) | Age {age}. Meanwhile, on your phone. | Umur {age}. Sementara itu, di HP lo. |
| card.options | Your options | Pilihan lo |
| card.choose | Choose | Pilih |
| card.seeWhat | See what happens | Lihat hasilnya |
| card.warning.capek | Running on fumes lately. | Energi lo tinggal dikit. |
| card.warning.burnout | Burnout. Something has to give. | Udah burnout. Ada yang harus dilepas. |
| topBar.menu | Menu | Menu |
| topBar.age(age) | Age {age} | Umur {age} |
| topBar.feeling(word) | How you feel: {word} | Kondisi lo: {word} |
| topBar.wallet(amount) | Net worth {amount}. Open wallet | Kekayaan bersih {amount}. Buka dompet |
| wallet.title | Wallet | Dompet |
| wallet.netWorth | Net worth | Kekayaan bersih |
| wallet.cash | Savings | Tabungan |
| wallet.emergency | Emergency fund | Dana darurat |
| wallet.months(m) | {m} months of costs | {m} bulan biaya hidup |
| wallet.index | Index fund | Reksa dana indeks |
| wallet.property | Property | Properti |
| wallet.kpr | KPR (mortgage) | KPR |
| wallet.pinjol | Pinjol | Pinjol |
| wallet.cardDebt | Credit card | Kartu kredit |
| wallet.cover | Health cover | Asuransi kesehatan |
| wallet.insured | BPJS and private | BPJS plus swasta |
| wallet.bpjsOnly | BPJS only | BPJS aja |
| wallet.plan | Money plan | Rencana duit |
| wallet.planValue save_all / half_index / invest_most / none | Save it all / Half to an index fund / Invest most of it / Not set yet | Tabung semua / Setengah ke reksa dana / Investasi hampir semua / Belum ada |
| wallet.income | Monthly income | Gaji sebulan |
| wallet.noIncome | None right now | Lagi gak ada |
| wallet.costs | Monthly costs | Biaya hidup sebulan |
| menu.title | Paused | Pause dulu |
| menu.resume | Keep playing | Lanjut main |
| menu.restart | Start a new life | Mulai hidup baru |
| menu.restartNote | This run ends here and cannot be resumed. | Run yang ini selesai di sini, gak bisa dilanjut. |

**outcome, recap**

| Key | en | jaksel |
|-|-|-|
| outcome.rollTitle(age) | Age {age}. How it landed. | Umur {age}. Hasilnya keluar. |
| outcome.youChose(label) | You chose: {label} | Pilihan lo: {label} |
| outcome.gain(amount) | Gain, {amount} | Untung, {amount} |
| outcome.loss(amount) | Loss, {amount} | Rugi, {amount} |
| outcome.goodQuiet | All good | Aman |
| outcome.badQuiet | Ouch | Apes |
| outcome.yourCall(word) | Your call: {word} | Keputusan lo: {word} |
| outcome.score 5 / 4 / 3 / 2 / 1 | excellent / sensible / fair / shaky / poor | mantap / masuk akal / lumayan / agak nekat / kurang oke |
| outcome.situation(months, hasPinjol, hasFamily) | At the time: {months} months saved, then `pinjol still open` or `no pinjol`, then `, a family to cover` when hasFamily, then a period | Waktu itu: dana darurat {months} bulan, then `masih ada pinjol` or `bebas pinjol`, then `, ada keluarga yang ditanggung` when hasFamily, then a period |
| outcome.luck.badFair | Bad luck, not your fault. | Yang ini apes, bukan salah lo. |
| outcome.luck.badRisky | Bad luck this time. | Kali ini apes. |
| outcome.luck.goodFair | A lucky break. | Hoki dikit. |
| outcome.luck.goodRisky | Lucky this time. | Kali ini hoki. |
| recap.title(age) | Age {age}, done. | Umur {age} kelar. |
| recap.span(from, to) | Ages {from} to {to}, done. | Umur {from} sampai {to} kelar. |
| recap.quiet | Quiet years. Life went on. | Tahun-tahun yang tenang. Hidup jalan terus. |
| recap.job | Job | Kerjaan |
| recap.unemployed | Between jobs | Lagi nganggur |
| recap.income | Income | Gaji |
| recap.perMonth(amount) | {amount} a month | {amount} sebulan |
| recap.netWorth | Net worth | Kekayaan bersih |
| recap.change(delta, years) | {delta} this year, or {delta} over {years} years | {delta} tahun ini, or {delta} dalam {years} tahun |
| recap.feeling | Feeling | Kondisi |
| recap.event promoted / fired / rehired | Promoted. / You lost your job. / Back at work. | Naik jabatan. / Lo kena PHK. / Udah kerja lagi. |
| recap.next | Next year | Tahun depan |
| recap.finish | See my life | Liat hasil hidup gue |

**report, error**

| Key | en | jaksel |
|-|-|-|
| report.done | You made it to 60 | Lo berhasil sampai umur 60 |
| report.yourLifeworth | Your Lifeworth | Lifeworth lo |
| report.archetype burnt_out / rich_but_tired / lucky_gambler | Burnt out / Rich but tired / Lucky gambler | Burnout akut / Tajir tapi capek / Gambler hoki |
| report.archetype unlucky_but_wise / steady_compounder / broke_but_happy | Unlucky but wise / Steady compounder / Broke but happy | Apes tapi bijak / Compounder kalem / Bokek tapi bahagia |
| report.archetype sandwich_hero / balanced / getting_by | Sandwich hero / Balanced / Getting by | Pahlawan sandwich / Hidup seimbang / Yang penting jalan |
| report.tile netWorth / wellbeing / decisions / luck | Net worth / Wellbeing / Decisions / Luck | Kekayaan / Wellbeing / Keputusan / Hoki |
| report.calls(n) | {n} calls graded | {n} keputusan dinilai |
| report.relationships strong / okay / strained | Your people stayed close. / Your people are still around. / Your people drifted away. | Orang-orang terdekat lo tetep deket. / Circle lo masih ada, walau gak sedeket dulu. / Circle lo pelan-pelan menjauh. |
| report.best(age, label) | Best call, at {age}: {label} | Keputusan terbaik, umur {age}: {label} |
| report.worst(age, label) | Worst call, at {age}: {label} | Keputusan terburuk, umur {age}: {label} |
| report.netWorthChart(from, to) | Net worth, age {from} to {to} | Kekayaan bersih, umur {from} sampai {to} |
| report.exactly(amount) | Exactly {amount} | Tepatnya {amount} |
| report.drop(age) | Biggest drop at {age} | Paling anjlok di umur {age} |
| report.wellbeingChart(from, to) | Wellbeing, age {from} to {to} | Wellbeing, umur {from} sampai {to} |
| report.shaded | Shaded: tired or burnt out | Arsir: capek atau burnout |
| report.netWorthSummary(fromAge, start, toAge, end) | Net worth went from {start} at {fromAge} to {end} at {toAge}. | Kekayaan bersih dari {start} di umur {fromAge} jadi {end} di umur {toAge}. |
| report.wellbeingSummary(avg, final) | Average wellbeing {avg}, ending at {final}. | Rata-rata wellbeing {avg}, akhirnya {final}. |
| report.again | Live another life | Main lagi |
| error.title | Something broke. | Ada yang rusak. |
| error.body | Not your fault. This life cannot continue. | Bukan salah lo. Hidup yang ini gak bisa lanjut. |
| error.action | Start a new life | Mulai hidup baru |

- [ ] **Step 1: Write the failing tests**

```ts
// src/ui/i18n/format.test.ts
it.each([
  [0, 'Rp0', 'Rp0'],
  [950, 'Rp950', 'Rp950'],
  [400_000, 'Rp400K', 'Rp400 rb'],
  [1_500_000, 'Rp1.5M', 'Rp1,5 jt'],
  [42_000_000, 'Rp42M', 'Rp42 jt'],
  [999_600_000, 'Rp1B', 'Rp1 M'],
  [8_412_345_678, 'Rp8.4B', 'Rp8,4 M'],
  [-2_585_005_870, '-Rp2.6B', '-Rp2,6 M'],
  [1_250_000_000_000, 'Rp1.3T', 'Rp1,3 T'],
])('formatShort(%i)', (n, en, jaksel) => {
  expect(formatShort(n, 'en')).toBe(en);
  expect(formatShort(n, 'jaksel')).toBe(jaksel);
});
it('formats exact Rupiah, deltas, months and rank bands', () => {
  expect(formatRupiah(8_500_000, 'en')).toBe('Rp8,500,000');
  expect(formatRupiah(-10_000_000, 'jaksel')).toBe('-Rp10.000.000');
  expect(formatDelta(15_000_000, 'en')).toBe('+Rp15M');
  expect(formatDelta(-10_000_000, 'jaksel')).toBe('-Rp10 jt');
  expect(formatMonths(6, 'en')).toBe('6');
  expect(formatMonths(4.2, 'jaksel')).toBe('4,2');
  expect([0, 30, 50, 80, 100].map(rankBand)).toEqual(['Bottom 1%', 'Bottom 30%', 'Top 50%', 'Top 20%', 'Top 1%']);
});

// src/ui/i18n/strings.test.ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/i18n`
Expected: FAIL, cannot resolve `./format` and `./strings`.

- [ ] **Step 3: Implement `format.ts` and `strings.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui/i18n` then `npm run typecheck`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/i18n
git commit -m "feat: add Rupiah formatting and the English and Jaksel UI copy"
```

---

### Task 7: Tokens, AA contrast and choice tiles

**Files:**
- Create: `src/ui/styles/tokens.css`, `src/ui/styles/base.css`, `src/ui/components/RadioTiles.tsx`, `src/ui/components/ChoiceList.tsx`, `src/ui/components/tiles.css`
- Modify: `src/main.tsx` (import `tokens.css`, then `base.css`)
- Test: `src/ui/styles/contrast.test.ts`, `src/ui/components/ChoiceList.test.tsx`

**Interfaces:**
- Produces:
  - `RadioTiles<T extends string>(props: { name: string; legend: string; options: readonly { value: T; label: string; note?: string }[]; value: T | null; onChange(value: T): void })`: a `fieldset` with a visually hidden `legend`; each option is a `label.tile` wrapping a visually hidden native radio, the label text and an optional `.tile-note`. Every tile has the same class string whether picked or not; the picked style comes from `.tile:has(input:checked)` and focus from `.tile:has(input:focus-visible)`.
  - `ChoiceList(props: { legend: string; options: readonly { value: string; label: string; note?: string }[]; confirmLabel: string; onConfirm(value: string): void })`: a `form` holding `RadioTiles` and a submit button (`.btn`) that stays disabled until a pick, calls `onConfirm` once, then locks.
  - CSS classes used by later tasks: `.app`, `.screen-title`, `.screen-sub`, `.actions`, `.btn`, `.btn-danger`, `.btn-ghost`, `.visually-hidden`, `.tile`, `.tile-note`.

`tokens.css` (exact):

```css
:root {
  --pandan: #3CC46B; --pandan-d: #2A9A51;
  --telang: #1E9BF0; --telang-d: #1478C2; --telang-bg: #DDF1FF;
  --sambal: #FF4D4F; --sambal-d: #D93A3C; --sambal-bg: #FFE5E5;
  --kunyit: #FFC21A; --kunyit-d: #E0A100;
  --ubi: #A46BF5; --ubi-d: #7E4BD1;
  --ink: #2F3B45; --muted: #77838C; --line: #E3E7EA; --paper: #FFFFFF;
  --telang-line: #8CCBF5; --kunyit-bg: #FFF3CC; --kunyit-text: #B88400;
  --pandan-bg: #E2F7E9; --sambal-edge: #A82D2F; --muted-text: #66727B;
  --radius: 16px; --edge: 4px; --font: 'Nunito', system-ui, sans-serif;
}
```

The first four lines are spec section 6. `--telang-line`, `--kunyit-bg` and `--kunyit-text` come from mockup v3. The last colour line is new: a Pandan tint for the green sheet (the spec gives Pandan no tint), a darker edge for the red button, and a muted text shade that passes AA on white (spec muted is 3.9:1, kept for icons and borders).

Port the mockup CSS (`.du-*` rules in the mockup file) to these classes. Everything not listed keeps the mockup's sizes, weights, radii and spacing.

| Mockup | Here | Change for AA or the app |
|-|-|-|
| `.du-phone` | `.app` | No frame: max-width 480px, centred, min-height 100dvh, padding 18px 16px, column, gap 14px, `overflow-wrap: anywhere`, `body` background `--paper` |
| `.du-title`, `.du-sub` | `.screen-title`, `.screen-sub` | Sub text `--muted-text` |
| `.du-foot` | `.actions` | none |
| `.du-opt`, `.du-opt.sel` | `.tile`, `.tile:has(input:checked)` | Picked text is Ink, not Telang dark (4.0:1); note `--muted-text`, Ink when picked |
| `.du-btn` | `.btn` | Label Ink, not white (white on Pandan is 2.3:1); disabled at 0.5 opacity; min-height 48px |
| `.du-btn.red` | `.btn-danger` | Face `--sambal-d`, edge `--sambal-edge`, white label (4.5:1) |
| `.du-btn.ghost` | `.btn-ghost` | none |
| focus rule | `:focus-visible` on buttons and inputs, `.tile:has(input:focus-visible)` | none |

Also in `base.css`: a box-sizing reset, `font-family: var(--font)` at weight 700, `.visually-hidden`, and under `prefers-reduced-motion: reduce` no CSS animation or transition.

- [ ] **Step 1: Write the failing tests**

```ts
// src/ui/styles/contrast.test.ts
import tokens from './tokens.css?raw';

const hex = (name: string): string => {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9A-F]{6})`));
  if (!m?.[1]) throw new Error(`missing token ${name}`);
  return m[1];
};
const luminance = (h: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(hex(a)), luminance(hex(b))].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

it.each([
  ['ink', 'paper', 4.5], ['muted-text', 'paper', 4.5], ['ink', 'pandan', 4.5], ['paper', 'sambal-d', 4.5],
  ['telang-d', 'paper', 4.5], ['ink', 'telang-bg', 4.5], ['ink', 'sambal-bg', 4.5], ['ink', 'pandan-bg', 4.5],
  ['ink', 'kunyit', 4.5], ['paper', 'ubi-d', 4.5], ['ubi-d', 'sambal-bg', 4.5], ['ubi-d', 'pandan-bg', 4.5],
  ['sambal-d', 'sambal-bg', 3], ['pandan-d', 'pandan-bg', 3], ['kunyit-text', 'paper', 3], ['pandan-d', 'paper', 3],
  ['muted', 'paper', 3], ['sambal', 'paper', 3],
] as const)('%s on %s reaches %s:1', (fg, bg, min) => {
  expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
});
it('keeps the spec palette exact', () => {
  expect(['pandan', 'pandan-d', 'telang', 'telang-d', 'telang-bg', 'sambal', 'sambal-d', 'sambal-bg', 'kunyit', 'kunyit-d', 'ubi', 'ubi-d', 'ink', 'muted', 'line', 'paper'].map(hex))
    .toEqual(['#3CC46B', '#2A9A51', '#1E9BF0', '#1478C2', '#DDF1FF', '#FF4D4F', '#D93A3C', '#FFE5E5', '#FFC21A', '#E0A100', '#A46BF5', '#7E4BD1', '#2F3B45', '#77838C', '#E3E7EA', '#FFFFFF']);
});

// src/ui/components/ChoiceList.test.tsx
const OPTIONS = [
  { value: 'book', label: 'Gas, healing itu penting' },
  { value: 'bali', label: 'Bali aja deh', note: 'Rp6 jt' },
  { value: 'skip', label: 'Skip dulu, mau nabung' },
];
const setup = () => {
  const onConfirm = vi.fn();
  render(<ChoiceList legend="Pilihan lo" options={OPTIONS} confirmLabel="Pilih" onConfirm={onConfirm} />);
  return { onConfirm, user: userEvent.setup() };
};

it('styles every option the same and confirms once, only after a pick', async () => {
  const { onConfirm, user } = setup();
  const tiles = () => screen.getAllByRole('radio').map((r) => r.closest('label')!.className);
  expect(new Set(tiles()).size).toBe(1);
  const confirm = screen.getByRole('button', { name: 'Pilih' });
  expect(confirm).toBeDisabled();
  await user.click(screen.getByRole('radio', { name: /Bali aja deh/ }));
  expect(new Set(tiles()).size).toBe(1);
  await user.dblClick(confirm);
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledWith('bali');
});
it('works from the keyboard', async () => {
  const { onConfirm, user } = setup();
  screen.getByRole('radio', { name: /Skip dulu/ }).focus();
  await user.keyboard(' ');
  screen.getByRole('button', { name: 'Pilih' }).focus();
  await user.keyboard('{Enter}');
  expect(onConfirm).toHaveBeenCalledWith('skip');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/styles src/ui/components`
Expected: FAIL, missing `tokens.css` and `./ChoiceList`.

- [ ] **Step 3: Implement the CSS, `RadioTiles` and `ChoiceList`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui` then `npm run typecheck`
Expected: all pass, no type errors. If a contrast pair fails, adjust only a non-spec token.

- [ ] **Step 5: Commit**

```bash
git add src/ui src/main.tsx
git commit -m "feat: add design tokens, AA contrast checks and choice tiles"
```

---

### Task 8: Oren, the heart and the coin

**Files:**
- Create: `src/ui/art/Oren.tsx`, `src/ui/art/Heart.tsx`, `src/ui/art/icons.tsx`, `src/ui/art/CoinFlip.tsx`, `src/ui/art/art.css`
- Test: `src/ui/art/art.test.tsx`

**Interfaces:**
- Produces:
  - `type OrenExpression = 'curious' | 'happy' | 'shocked' | 'tired' | 'exhausted'`; `Oren(props: { expression: OrenExpression; size?: number })`, an `aria-hidden` svg, viewBox `0 0 100 110`, width `size` (default 84), `data-expression`, with the face inside `<g data-face>`.
  - `orenFor(level: WellbeingLevel): OrenExpression`: seger happy, oke curious, capek tired, burnout exhausted.
  - `Heart(props: { level: WellbeingLevel })`: 24px `aria-hidden` svg in `--sambal`; from oke down it draws one `path[data-crack]` in `--paper`, stroke 1.6, round caps; seger has no crack.
  - `CloseIcon()`, `CoinIcon()`, `MomentIcon(props: { kind: MomentKind })`: `aria-hidden` svgs.
  - `CoinFlip(props: { face: 'good' | 'bad' })`: the 64px coin in `.coin-stage` (perspective 600px) with `data-coin={face}`. On mount it animates `rotateY` from 0 to 1800 (good, smiling face up) or 1980 (bad, frowning face up) and `y` through `[0, -44, 0]` over 1.1s with ease `[0.2, 0.7, 0.25, 1]`; faces use `backface-visibility: hidden` and the back face sits at `rotateY(180deg)`. Under reduced motion it renders at the final angle.

Art (Oren's body and the curious, shocked and happy faces are verbatim from mockup v3):

```svg
<!-- Oren body, drawn first, in this order -->
<path d="M80 96 C98 92 99 72 88 66" stroke="#F08A2C" stroke-width="9" fill="none" stroke-linecap="round"/>
<path d="M24 108 C20 80 30 66 50 66 C70 66 80 80 76 108 Z" fill="#FF9A3C"/>
<ellipse cx="50" cy="95" rx="15" ry="12" fill="#FFE3C4"/>
<ellipse cx="37" cy="107" rx="8" ry="4.5" fill="#FFB56B"/><ellipse cx="63" cy="107" rx="8" ry="4.5" fill="#FFB56B"/>
<path d="M17 36 L21 7 Q23 2 28 5 L45 22 Z" fill="#FF9A3C"/><path d="M83 36 L79 7 Q77 2 72 5 L55 22 Z" fill="#FF9A3C"/>
<path d="M23 27 L25 12 L35 21 Z" fill="#FFB3B3"/><path d="M77 27 L75 12 L65 21 Z" fill="#FFB3B3"/>
<ellipse cx="50" cy="42" rx="36" ry="30" fill="#FF9A3C"/>
<path d="M44 14 Q45 19 44 24 M50 13 V24 M56 14 Q55 19 56 24" stroke="#E0731C" stroke-width="3.5" stroke-linecap="round" fill="none"/>
<ellipse cx="50" cy="55" rx="16" ry="11" fill="#FFE3C4"/>
<path d="M46 50 H54 L50 54 Z" fill="#FF7A8A"/>

<!-- curious: eyes blink (class oren-blink, transform-box fill-box, origin center, 4s scaleY to 0.1 at 95%, only under prefers-reduced-motion: no-preference) -->
<g class="oren-blink"><ellipse cx="36" cy="40" rx="9" ry="10" fill="#fff"/><ellipse cx="64" cy="40" rx="9" ry="10" fill="#fff"/><circle cx="40" cy="41" r="5" fill="#2F3B45"/><circle cx="68" cy="41" r="5" fill="#2F3B45"/><circle cx="42" cy="39" r="1.8" fill="#fff"/><circle cx="70" cy="39" r="1.8" fill="#fff"/></g>
<path d="M50 54 Q47 59 44 57 M50 54 Q53 59 56 57" stroke="#2F3B45" stroke-width="2.2" fill="none" stroke-linecap="round"/>

<!-- shocked -->
<ellipse cx="36" cy="39" rx="10" ry="11" fill="#fff"/><ellipse cx="64" cy="39" rx="10" ry="11" fill="#fff"/><circle cx="36" cy="40" r="3.2" fill="#2F3B45"/><circle cx="64" cy="40" r="3.2" fill="#2F3B45"/>
<ellipse cx="50" cy="60" rx="4.5" ry="5.5" fill="#2F3B45"/><path d="M86 20 q5 7 0 10.5 q-5 -3.5 0 -10.5z" fill="#8FD0FF"/>

<!-- happy -->
<path d="M28 42 Q36 33 44 42 M56 42 Q64 33 72 42" stroke="#2F3B45" stroke-width="3.6" fill="none" stroke-linecap="round"/>
<path d="M42 56 Q50 66 58 56 Z" fill="#2F3B45"/>
<ellipse cx="27" cy="52" rx="5" ry="3" fill="#FF8A8A" opacity=".6"/><ellipse cx="73" cy="52" rx="5" ry="3" fill="#FF8A8A" opacity=".6"/>

<!-- tired (new): heavy lids over half-open eyes, flat mouth -->
<path d="M27 40 A9 7 0 0 0 45 40 Z" fill="#fff"/><path d="M55 40 A9 7 0 0 0 73 40 Z" fill="#fff"/>
<circle cx="37" cy="43" r="3.5" fill="#2F3B45"/><circle cx="65" cy="43" r="3.5" fill="#2F3B45"/>
<path d="M26 40 H46 M54 40 H74" stroke="#E0731C" stroke-width="3" stroke-linecap="round"/>
<path d="M45 58 H55" stroke="#2F3B45" stroke-width="2.4" stroke-linecap="round"/>

<!-- exhausted (new): droopy eyes, bags, wavy mouth, sweat drop -->
<path d="M28 44 L44 41 M56 41 L72 44" stroke="#2F3B45" stroke-width="3.4" stroke-linecap="round"/>
<path d="M30 49 Q36 52 42 49 M58 49 Q64 52 70 49" stroke="#E0731C" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M43 60 Q46.5 57 50 60 Q53.5 63 57 60" stroke="#2F3B45" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path d="M86 20 q5 7 0 10.5 q-5 -3.5 0 -10.5z" fill="#8FD0FF"/>

<!-- Heart, viewBox 0 0 24 24 (mockup), then the crack per level -->
<path d="M12 21s-8.5-5.2-10.4-10.6C.3 6.6 3 3 6.8 3c2.2 0 4 1.2 5.2 3 1.2-1.8 3-3 5.2-3C21 3 23.7 6.6 22.4 10.4 20.5 15.8 12 21 12 21z"/>
oke:     M12 6 L10.8 9
capek:   M12 6 L10.6 9.5 L13 12 L11.4 15
burnout: M12 6 L10.6 9.5 L13 12 L11.4 15 L12 21

<!-- CloseIcon, viewBox 0 0 18 18, colour --muted -->
<path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
<!-- CoinIcon, viewBox 0 0 24 24 -->
<circle cx="12" cy="12" r="10" fill="#FFC21A"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#E0A100" stroke-width="2.2"/>
<!-- Coin faces, viewBox 0 0 100 100: both start with these two circles -->
<circle cx="50" cy="50" r="48" fill="#E0A100"/><circle cx="50" cy="50" r="43" fill="#FFC21A"/>
good: <circle cx="38" cy="44" r="5" fill="#2F3B45"/><circle cx="62" cy="44" r="5" fill="#2F3B45"/><path d="M36 58 Q50 70 64 58" stroke="#2F3B45" stroke-width="5" fill="none" stroke-linecap="round"/>
bad:  <circle cx="38" cy="46" r="5" fill="#2F3B45"/><circle cx="62" cy="46" r="5" fill="#2F3B45"/><path d="M37 66 Q50 56 63 66" stroke="#2F3B45" stroke-width="5" fill="none" stroke-linecap="round"/>

<!-- MomentIcon, viewBox 0 0 36 36, on <rect width="36" height="36" rx="9" fill="#E3E7EA"/> -->
story: <circle cx="18" cy="18" r="11" fill="none" stroke="#2F3B45" stroke-width="2.5"/><circle cx="18" cy="15.5" r="3.5" fill="#2F3B45"/><path d="M11.5 24.5 Q18 18 24.5 24.5 Z" fill="#2F3B45"/>
chat:  <path d="M9 10 H27 A3 3 0 0 1 30 13 V21 A3 3 0 0 1 27 24 H17 L12 28 V24 H9 A3 3 0 0 1 6 21 V13 A3 3 0 0 1 9 10 Z" fill="#2F3B45"/>
bank:  <rect x="7" y="11" width="22" height="15" rx="3" fill="#E0A100"/><rect x="7" y="15" width="22" height="3" fill="#2F3B45"/>
email: <rect x="7" y="11" width="22" height="15" rx="2.5" fill="none" stroke="#2F3B45" stroke-width="2.5"/><path d="M8.5 12.5 L18 20 L27.5 12.5" fill="none" stroke="#2F3B45" stroke-width="2.5" stroke-linejoin="round"/>
notif: <path d="M18 8 A7 7 0 0 1 25 15 V20 L27.5 23.5 H8.5 L11 20 V15 A7 7 0 0 1 18 8 Z" fill="#2F3B45"/><circle cx="18" cy="27" r="2.5" fill="#2F3B45"/>
```

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/art/art.test.tsx
const EXPRESSIONS = ['curious', 'happy', 'shocked', 'tired', 'exhausted'] as const;
const LEVELS = ['seger', 'oke', 'capek', 'burnout'] as const;

it('draws a distinct face for each expression', () => {
  const faces = EXPRESSIONS.map((e) => {
    const { container, unmount } = render(<Oren expression={e} />);
    const html = container.querySelector('[data-face]')!.innerHTML;
    unmount();
    return html;
  });
  expect(new Set(faces).size).toBe(5);
});
it('maps feelings to expressions', () => {
  expect(LEVELS.map(orenFor)).toEqual(['happy', 'curious', 'tired', 'exhausted']);
});
it('cracks the heart further at each lower level', () => {
  const cracks = LEVELS.map((level) => {
    const { container, unmount } = render(<Heart level={level} />);
    const length = container.querySelector('[data-crack]')?.getAttribute('d')?.length ?? 0;
    unmount();
    return length;
  });
  expect(cracks[0]).toBe(0);
  expect(cracks[1]! > 0 && cracks[1]! < cracks[2]! && cracks[2]! < cracks[3]!).toBe(true);
});
it('lands the coin on the face it was given', () => {
  render(<MotionRoot><CoinFlip face="bad" /></MotionRoot>);
  expect(document.querySelector('[data-coin]')).toHaveAttribute('data-coin', 'bad');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/art`
Expected: FAIL, cannot resolve `./Oren`.

- [ ] **Step 3: Implement the art components and `art.css`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui/art` then `npm run typecheck`
Expected: 4 tests pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/art
git commit -m "feat: add Oren, the cracking heart and the coin flip"
```

---

### Task 9: Top bar, sheets, wallet and menu

**Files:**
- Create: `src/ui/store.tsx`, `src/ui/storage.ts`, `src/ui/use-count-up.ts`, `src/ui/test/render.tsx`, `src/ui/components/TopBar.tsx`, `src/ui/components/Sheet.tsx`, `src/ui/components/chrome.css`, `src/ui/panels/WalletPanel.tsx`, `src/ui/panels/MenuPanel.tsx`
- Test: `src/ui/storage.test.ts`, `src/ui/use-count-up.test.tsx`, `src/ui/components/TopBar.test.tsx`, `src/ui/components/Sheet.test.tsx`, `src/ui/panels/panels.test.tsx`

**Interfaces:**
- Consumes: the store (Task 5), strings and formatting (Task 6), `RadioTiles` (Task 7), `Heart`, `CloseIcon`, `CoinIcon` (Task 8).
- Produces:
  - `src/ui/store.tsx`: `AppStoreProvider(props: { store: AppStore; children: ReactNode })`, `useApp<T>(selector: (s: AppState & AppActions) => T): T` (via `useStore` from `zustand`), `useLocale(): Locale`, `useStrings(): Strings`.
  - `src/ui/storage.ts`: `browserStore(get: () => Storage = () => window.localStorage): KeyValueStore`. It probes with a write and remove; if anything throws it returns `memoryStore()`, so the game still plays without saving.
  - `src/ui/use-count-up.ts`: `useCountUp(target: number, seconds = 0.6): number`. Animates from the previous target with Motion's `animate(from, to, { duration, ease: 'easeOut', onUpdate })`, rounds each frame, stops on unmount, and returns the target at once under `useReducedMotion()`.
  - `src/ui/test/render.tsx`: `renderWithStore(ui: ReactElement, options?: { game?: Game; locale?: Locale; content?: readonly Card[]; storage?: KeyValueStore; seed?: string }): RenderResult & { store: AppStore; user: UserEvent }`. It builds a store with `memoryStore()` (or the given storage), `CONTENT` (or the given content) and `newSeed: () => seed ?? 'ui-test'`, applies `game` and `locale` with `store.setState`, and renders inside `AppStoreProvider` and `MotionRoot`.
  - `TopBar()`: renders nothing without a game. A `header.topbar` holding the menu button (`CloseIcon`, aria-label `topBar.menu`, opens `menu`), the life bar (`role="progressbar"`, aria-label `topBar.age(age)`, `aria-valuemin` start age, `aria-valuemax` `END_AGE`, `aria-valuenow` age; fill width = `history.length / (END_AGE - startAge + 1)`; Pandan with the mockup's highlight stripe), the feeling (`Heart` plus the word, aria-label `topBar.feeling(word)`, text in Ink), and the money button (`CoinIcon` plus `formatShort(useCountUp(netWorth))` in Ink; aria-label `topBar.wallet(formatShort(netWorth))`; opens `wallet`). The menu and money buttons are at least 44px.
  - `Sheet(props: { title: string; closeLabel: string; onClose(): void; children: ReactNode })`: a bottom sheet with a backdrop (a tap closes it), `role="dialog"`, `aria-modal="true"`, `aria-labelledby` its `h2`, and a close button. On mount it remembers the focused element and focuses its close button; Escape calls `onClose`; on unmount it returns focus to the remembered element if that is still in the document. The panel slides up from `y: '100%'`.
  - `WalletPanel()`: `Sheet` titled `wallet.title` with a `dl` from `toVisible(run.state)`: net worth, savings, emergency fund (`wallet.months(formatMonths(...))`), index fund, property, KPR, pinjol, credit card, health cover, money plan, monthly income (or `wallet.noIncome`), monthly costs. Every amount is `formatRupiah`.
  - `MenuPanel()`: `Sheet` titled `menu.title` with `RadioTiles` for the language (legend `welcome.language`, options English and Jaksel), a `.btn` `menu.resume` that closes, a `.btn-danger` `menu.restart` that calls `quit`, and `menu.restartNote` under it.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/storage.test.ts
it('uses localStorage when it works and memory when it throws', () => {
  browserStore().setItem('k', 'v');
  expect(localStorage.getItem('k')).toBe('v');
  const fallback = browserStore(() => { throw new Error('denied'); });
  fallback.setItem('k', 'w');
  expect(fallback.getItem('k')).toBe('w');
});

// src/ui/use-count-up.test.tsx
it('lands on the new value', async () => {
  function Probe({ n }: { n: number }) { return <output>{useCountUp(n)}</output>; }
  const { rerender } = render(<MotionRoot><Probe n={10} /></MotionRoot>);
  expect(screen.getByRole('status')).toHaveTextContent('10');
  rerender(<MotionRoot><Probe n={500} /></MotionRoot>);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('500'));
});

// src/ui/components/TopBar.test.tsx
it('shows the feeling as a word, never a number', () => {
  const game = atCard('bar-demo', CONTENT, 'japan_trip', (s) => ({ ...s, wellbeing: 30 }));
  renderWithStore(<TopBar />, { game, locale: 'jaksel' });
  const feeling = screen.getByLabelText('Kondisi lo: Capek');
  expect(feeling).toHaveTextContent('Capek');
  expect(feeling.textContent).not.toMatch(/\d/);
});
it('tracks age and opens the wallet and the menu', async () => {
  const game = atCard('bar-demo', CONTENT, 'japan_trip', (s) => ({ ...s, fin: { ...s.fin, cash: 42_000_000 } }));
  const { store, user } = renderWithStore(<TopBar />, { game });
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(game.run.state.age));
  await user.click(screen.getByRole('button', { name: 'Net worth Rp42M. Open wallet' }));
  expect(store.getState().panel).toBe('wallet');
  await user.click(screen.getByRole('button', { name: 'Menu' }));
  expect(store.getState().panel).toBe('menu');
});

// src/ui/components/Sheet.test.tsx
it('is a labelled dialog that takes focus, closes on Escape and returns focus', async () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return <><button type="button" onClick={() => setOpen(true)}>Open</button>
      {open && <Sheet title="Dompet" closeLabel="Tutup" onClose={() => setOpen(false)}><p>isi</p></Sheet>}</>;
  }
  const user = userEvent.setup();
  render(<MotionRoot><Harness /></MotionRoot>);
  await user.click(screen.getByRole('button', { name: 'Open' }));
  expect(screen.getByRole('dialog', { name: 'Dompet' })).toContainElement(document.activeElement as HTMLElement);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
});

// src/ui/panels/panels.test.tsx
it('lists exact money, the emergency fund in months and the cover', () => {
  const game = atCard('wallet-demo', CONTENT, 'japan_trip',
    (s) => ({ ...s, fin: { ...s.fin, cash: 12_500_000, pinjol: 3_000_000, pinjolPrincipal: 3_000_000 } }));
  renderWithStore(<WalletPanel />, { game, locale: 'jaksel' });
  const dialog = within(screen.getByRole('dialog', { name: 'Dompet' }));
  expect(dialog.getByText('Rp12.500.000')).toBeInTheDocument();
  expect(dialog.getByText('Rp3.000.000')).toBeInTheDocument();
  expect(dialog.getByText('BPJS aja')).toBeInTheDocument();
  const months = formatMonths(toVisible(game.run.state).emergencyMonths, 'jaksel');
  expect(dialog.getByText(`${months} bulan biaya hidup`)).toBeInTheDocument();
});
it('switches language live and starts over', async () => {
  const { store, user } = renderWithStore(<MenuPanel />, { game: atCard('menu-demo', CONTENT, 'japan_trip') });
  await user.click(screen.getByRole('radio', { name: 'Jaksel' }));
  expect(store.getState().locale).toBe('jaksel');
  expect(screen.getByRole('dialog', { name: 'Pause dulu' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Mulai hidup baru' }));
  expect(store.getState().game).toBeNull();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui`
Expected: the new files FAIL to resolve; earlier UI tests still pass.

- [ ] **Step 3: Implement the modules listed above**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui` then `npm run typecheck`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat: add the top bar, sheets, wallet and pause menu"
```

---

### Task 10: Welcome and birth lottery screens

**Files:**
- Create: `src/ui/screens/Welcome.tsx`, `src/ui/screens/Lottery.tsx`, `src/ui/screens/screens.css`
- Test: `src/ui/screens/Welcome.test.tsx`, `src/ui/screens/Lottery.test.tsx`

**Interfaces:**
- Consumes: store hooks, `RadioTiles`, `Oren`, strings and `rankBand`; `startLuckPercentile` from `src/engine`.
- Produces:
  - `Welcome()`: `Oren` happy; `h1` Lifeworth; `welcome.tagline`; `RadioTiles` for the language (legend `welcome.language`, options English and Jaksel, `onChange` = `setLocale`, so the copy switches live); a text input labelled `welcome.nickname` with `maxLength={NICKNAME_MAX}`, `autoComplete="off"` and `welcome.nicknameHint` linked by `aria-describedby`, bound to `setNickname`; a `.btn` `welcome.start` calling `start`; `welcome.disclaimer` in small muted text (spec 8).
  - `Lottery()`: `screen-title` `lottery.title`, `screen-sub` `lottery.sub`, `Oren` curious, a `dl` with the four rolls (label, then value word) and `lottery.firstJob(startAge)`, then `lottery.luck(rankBand(startLuckPercentile(luckPoints)))` in `--ubi-d`, and a `.btn` `lottery.go` calling `leaveLottery`. The rows enter staggered (opacity and y, 0.15s apart); under reduced motion they start in place.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/screens/Welcome.test.tsx
it('switches its copy when Jaksel is picked', async () => {
  const { user } = renderWithStore(<Welcome />);
  expect(screen.getByRole('button', { name: 'Start my life' })).toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: 'Jaksel' }));
  expect(screen.getByRole('button', { name: 'Mulai hidup' })).toBeInTheDocument();
});
it('starts a run with a trimmed nickname', async () => {
  const { store, user } = renderWithStore(<Welcome />);
  await user.type(screen.getByLabelText('Nickname (optional)'), '  Raka  ');
  await user.click(screen.getByRole('button', { name: 'Start my life' }));
  expect(store.getState().nickname).toBe('Raka');
  expect(store.getState().game?.screen.name).toBe('lottery');
});
it('caps the nickname at 20 characters', async () => {
  const { user } = renderWithStore(<Welcome />);
  const input = screen.getByLabelText('Nickname (optional)');
  await user.type(input, 'x'.repeat(30));
  expect(input).toHaveValue('x'.repeat(20));
});

// src/ui/screens/Lottery.test.tsx
it('reveals the four rolls, the first job age and how lucky the start was', () => {
  const game = startGame('lottery-demo', CONTENT);
  renderWithStore(<Lottery />, { game, locale: 'jaksel' });
  const start = game.run.state.start;
  const s = STRINGS.jaksel.lottery;
  for (const text of [
    s.familyValue[start.family], s.educationValue[start.education],
    start.supportsParents ? s.parentsValue.yes : s.parentsValue.no, s.temperamentValue[start.temperament],
    s.firstJob(start.startAge), s.luck(rankBand(startLuckPercentile(start.luckPoints))),
  ]) expect(screen.getByText(text)).toBeInTheDocument();
});
it('moves on to the first card', async () => {
  const { store, user } = renderWithStore(<Lottery />, { game: startGame('lottery-demo', CONTENT) });
  await user.click(screen.getByRole('button', { name: 'Get to work' }));
  expect(store.getState().game?.screen.name).toBe('card');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/screens`
Expected: FAIL, cannot resolve `./Welcome` and `./Lottery`.

- [ ] **Step 3: Implement both screens and `screens.css`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui` then `npm run typecheck`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/screens
git commit -m "feat: add the welcome screen and the birth lottery reveal"
```

---

### Task 11: Card screen

**Files:**
- Create: `src/ui/components/MomentLine.tsx`, `src/ui/components/OrenSays.tsx`, `src/ui/screens/CardScreen.tsx`
- Modify: `src/ui/screens/screens.css`
- Test: `src/ui/screens/CardScreen.test.tsx`

**Interfaces:**
- Consumes: `shownCard` (Task 3), `TopBar`, `ChoiceList`, `Oren`, `orenFor`, `MomentIcon`, strings.
- Produces:
  - `MomentLine(props: { moment: Moment })`: the mockup's `.du-notif` as `.moment`: `MomentIcon`, then `from` in Ink 800 on its own line and `copy[locale]` in `--muted-text` below, like a phone notification.
  - `OrenSays(props: { expression: OrenExpression; children: ReactNode })`: the mockup's `.du-scene`: `Oren` beside a speech bubble with its tail.
  - `CardScreen()`: `TopBar`; `h1.screen-title` `card.title[card.kind](age)`; at Capek or Burnout a warning line (`card.warning.capek` or `.burnout`, Ink on `--sambal-bg`, with a cracked `Heart`); `MomentLine` when the card has a moment; `OrenSays` with `orenFor(level)` and `card.copy[locale]`. Actions: a luck card gets one `.btn` `card.seeWhat` that picks `ok`; a card with exactly one choice gets one `.btn` labelled with that choice; otherwise `ChoiceList` (legend `card.options`, confirm `card.choose`, notes from `copy[locale].note`), all calling `pick`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/screens/CardScreen.test.tsx
it('renders a Jaksel dilemma with its phone moment and identical choices', async () => {
  const game = atCard('card-demo', CONTENT, 'japan_trip');
  const { store, user } = renderWithStore(<CardScreen />, { game, locale: 'jaksel' });
  expect(screen.getByRole('heading', { level: 1, name: `Umur ${game.run.state.age}. Pilih langkah lo.` })).toBeInTheDocument();
  expect(screen.getByText('dindaaa.r')).toBeInTheDocument();
  expect(screen.getByText('upload story dari Kyoto')).toBeInTheDocument();
  expect(screen.getByText('Grup chat udah mau booking Jepang buat April. Rp18 jt per orang. Lo ikut gak?')).toBeInTheDocument();
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  await user.click(screen.getByRole('radio', { name: /Bali aja deh/ }));
  await user.click(screen.getByRole('button', { name: 'Pilih' }));
  expect(store.getState().game?.screen.name).toBe('outcome');
  expect(store.getState().game?.run.last?.choiceId).toBe('bali');
});
it('gives a luck card one button', async () => {
  const { store, user } = renderWithStore(<CardScreen />, { game: atCard('card-demo', CONTENT, 'health_check') });
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'See what happens' }));
  expect(store.getState().game?.run.last?.choiceId).toBe('ok');
});
it('gives a one-choice feed card one button', () => {
  renderWithStore(<CardScreen />, { game: atCard('card-demo', CONTENT, 'friend_car') });
  expect(screen.getByRole('button', { name: 'Keep scrolling' })).toBeInTheDocument();
});
it('warns when tired and stays quiet when okay', () => {
  const tired = renderWithStore(<CardScreen />, { game: atCard('card-demo', CONTENT, 'japan_trip', (s) => ({ ...s, wellbeing: 30 })) });
  expect(screen.getByText('Running on fumes lately.')).toBeInTheDocument();
  tired.unmount();
  renderWithStore(<CardScreen />, { game: atCard('card-demo', CONTENT, 'japan_trip', (s) => ({ ...s, wellbeing: 60 })) });
  expect(screen.queryByText('Running on fumes lately.')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/screens/CardScreen.test.tsx`
Expected: FAIL, cannot resolve `./CardScreen`.

- [ ] **Step 3: Implement `MomentLine`, `OrenSays` and `CardScreen`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui` then `npm run typecheck`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat: add the card screen with phone moments and Oren"
```

---

### Task 12: Outcome sheet

**Files:**
- Create: `src/ui/outcome/describe.ts`, `src/ui/screens/OutcomeScreen.tsx`
- Modify: `src/ui/screens/screens.css`
- Test: `src/ui/outcome/describe.test.ts`, `src/ui/screens/OutcomeScreen.test.tsx`

**Interfaces:**
- Consumes: `ChoiceResult`, `VisibleState`, `DecisionScore` from `src/engine`; strings and formatting; `CoinFlip`, `Oren`, `TopBar`.
- Produces:

```ts
export type Tone = 'good' | 'bad' | 'neutral';
export interface OutcomeView {
  tone: Tone; coin: 'good' | 'bad' | null;
  headline: string | null; message: string | null;
  grade: { score: DecisionScore; label: string; situation: string } | null;
  luckLine: string | null;
}
export function describeOutcome(args: { before: VisibleState; after: VisibleState; result: ChoiceResult; locale: Locale }): OutcomeView;
```

  Rules, with `s = STRINGS[locale].outcome`, `roll = result.roll` and `delta = after.netWorth - before.netWorth`:
  - `lucky = roll.luck >= roll.expected`. With a roll, `tone` and `coin` are `good` when lucky and `bad` otherwise; without one, `tone` is `neutral` and `coin` is `null`. The sheet's colour follows the luck, never the money, so spending on a trip is not painted as a loss.
  - `headline`: with a roll, `s.gain(formatDelta(delta))` when delta is above 0, `s.loss(...)` below 0, and `s.goodQuiet` or `s.badQuiet` at 0; without a roll, `formatDelta(delta)` when delta is not 0, else `null`.
  - `message`: `result.message?.[locale] ?? null`.
  - `grade`: when `result.score` is set, `{ score, label: s.yourCall(s.score[score]), situation: s.situation(formatMonths(before.emergencyMonths), before.debt.pinjol > 0, before.married || before.children > 0) }`. It describes only what the player could see when deciding (spec 5.7); Plan 3 may replace it with per-choice reasons.
  - `luckLine`: with a roll, a fair call (no score, or 4 and up) gets `badFair` or `goodFair`, otherwise `badRisky` or `goodRisky`; without a roll, `null`.
- Produces: `OutcomeScreen()`: `TopBar`; `h1` `s.rollTitle(age)` when there was a roll, else the card's title; `screen-sub` `s.youChose(label)` for a choice, or the card copy for a luck card; a stage with `Oren` (shocked when bad, happy when good, else `orenFor(level)`) and `CoinFlip` when `coin` is set. Then a `section.feedback` coloured by tone (bad: `--sambal-bg` with a `--sambal-d` heading; good: `--pandan-bg` with a `--pandan-d` heading; neutral: paper with a `--line` top border; body text Ink), sliding up after a 1.1s delay when there is a coin, and at once otherwise or under reduced motion. Inside: the `h2` headline (`tabIndex={-1}`, focused on mount; when the headline is null the message takes `tabIndex={-1}` and the focus), the message, the `.grade` box (Ink heading; border Pandan for 4 and 5, Kunyit for 3, Sambal for 1 and 2; situation in `--muted-text`), the luck line in `--ubi-d`, and the Continue button (`common.continue`; `.btn-danger` on a bad sheet, `.btn` otherwise) calling `leaveOutcome`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/ui/outcome/describe.test.ts
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

// src/ui/screens/OutcomeScreen.test.tsx
it('plays the mockup moment end to end', async () => {
  const seed = findSeed((x) => draw(x, keyOf(rollStart(x).startAge, 'outcome', 'kopi_bet')) >= 0.35);
  const parked = atCard(seed, CONTENT, 'kopi_bet', (s) => ({ ...s, fin: { ...s.fin, cash: 120_000_000 } }));
  const game = pickChoice(parked, CONTENT, 'invest');
  const { store, user } = renderWithStore(<OutcomeScreen />, { game, locale: 'jaksel' });
  const heading = screen.getByRole('heading', { level: 2, name: 'Rugi, -Rp10 jt' });
  expect(heading).toHaveFocus();
  for (const text of ['Kedainya tutup setelah 8 bulan.', 'Keputusan lo: masuk akal', 'Yang ini apes, bukan salah lo.'])
    expect(screen.getByText(text)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Lanjut' }));
  expect(store.getState().game?.screen.name).not.toBe('outcome');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/outcome src/ui/screens/OutcomeScreen.test.tsx`
Expected: FAIL, cannot resolve `./describe` and `./OutcomeScreen`.

- [ ] **Step 3: Implement `describeOutcome` and `OutcomeScreen`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui` then `npm run typecheck`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat: add the outcome sheet with the decision grade and the luck line"
```

---

### Task 13: Year recap

**Files:**
- Create: `src/ui/screens/RecapScreen.tsx`
- Modify: `src/ui/screens/screens.css`
- Test: `src/ui/screens/RecapScreen.test.tsx`

**Interfaces:**
- Consumes: `Recap` (Task 3), `jobTitle` (Task 2), `TopBar`, `Oren`, strings and formatting.
- Produces: `RecapScreen()`: `TopBar`; `h1` `recap.title(toAge)`, or `recap.span(fromAge, toAge)` with `recap.quiet` as the sub when the span covers more than one year; an event banner when `event` is set (`recap.event[event]`; promoted and rehired on `--pandan-bg`, fired on `--sambal-bg`, Ink text); `Oren` with `orenFor(level)`; a `dl` with Job (`jobTitle(titleKey)`, or `recap.unemployed`), Income (`recap.perMonth(formatRupiah(monthlyIncome))`, only when employed), Net worth (`formatRupiah(netWorth)` with `recap.change(formatDelta(netWorthChange), toAge - fromAge + 1)` under it) and Feeling (`feeling[level]`); a `.btn` `recap.finish` when the run is finished, else `recap.next`, calling `leaveRecap`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/screens/RecapScreen.test.tsx
const recapGame = (over: Partial<Recap>, finished = false): Game => {
  const g = startGame('recap-demo', CONTENT);
  const recap: Recap = { fromAge: 27, toAge: 27, netWorth: 42_000_000, netWorthChange: 12_000_000, employed: true,
    titleKey: 'degree_1', monthlyIncome: 9_200_000, level: 'capek', event: 'promoted', ...over };
  return { ...g, run: { ...g.run, finished }, screen: { name: 'recap', recap } };
};

// The top bar shows the run's own feeling (Okay at the start), so the recap uses Tired to stay unambiguous.
it('recaps one year with the job, income, net worth and feeling', () => {
  renderWithStore(<RecapScreen />, { game: recapGame({}) });
  expect(screen.getByRole('heading', { level: 1, name: 'Age 27, done.' })).toBeInTheDocument();
  for (const text of ['Promoted.', 'Associate', 'Rp9,200,000 a month', 'Rp42,000,000', '+Rp12M this year', 'Tired'])
    expect(screen.getByText(text)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next year' })).toBeInTheDocument();
});
it('fast-forwards quiet years under one title', () => {
  renderWithStore(<RecapScreen />, { game: recapGame({ fromAge: 31, toAge: 34, event: null, employed: false, netWorthChange: -3_000_000 }), locale: 'jaksel' });
  for (const text of ['Umur 31 sampai 34 kelar.', 'Tahun-tahun yang tenang. Hidup jalan terus.', 'Lagi nganggur', '-Rp3 jt dalam 4 tahun'])
    expect(screen.getByText(text)).toBeInTheDocument();
  expect(screen.queryByText('Gaji')).not.toBeInTheDocument();
});
it('offers the report after the last year', async () => {
  const { store, user } = renderWithStore(<RecapScreen />, { game: recapGame({ fromAge: 60, toAge: 60, event: null }, true) });
  await user.click(screen.getByRole('button', { name: 'See my life' }));
  expect(store.getState().game?.screen.name).toBe('report');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/screens/RecapScreen.test.tsx`
Expected: FAIL, cannot resolve `./RecapScreen`.

- [ ] **Step 3: Implement `RecapScreen`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui` then `npm run typecheck`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/screens
git commit -m "feat: add the year recap with the quiet-year fast-forward"
```

---

### Task 14: Report and charts

**Files:**
- Create: `src/ui/report/chart-math.ts`, `src/ui/report/charts.tsx`, `src/ui/report/report.css`, `src/ui/screens/ReportScreen.tsx`
- Test: `src/ui/report/chart-math.test.ts`, `src/ui/screens/ReportScreen.test.tsx`

**Interfaces:**
- Consumes: `buildReport`, `PERCENTILE_TABLES`, `Report` from `src/engine`; `Oren`; strings and formatting.
- Produces (`chart-math.ts`):
  - `interface Point { x: number; y: number }`
  - `toPoints(values: readonly number[], width: number, height: number, range?: { min: number; max: number }): Point[]`. Default range `min = Math.min(0, ...values)`, `max = Math.max(...values, min + 1)`. `x = i * width / (n - 1)` (0 for a single value), `y = height - (v - min) / (max - min) * height`, both rounded to one decimal.
  - `linePath(points): string` (`M0 80 L130 40`), `areaPath(points, height): string` (the line, then `V{height} H0 Z`), `biggestDrop(values): number | null` (index of the largest one-step fall, `null` if nothing falls), `strainedBands(levels: readonly WellbeingLevel[]): { start: number; end: number }[]` (runs of capek or burnout).
- Produces (`charts.tsx`), both svg `viewBox="0 0 260 80" preserveAspectRatio="none"` with `role="img"` inside a `.chart` box as in the mockup:
  - `NetWorthChart(props: { series: Report['series']; startAge: number })`: caption `report.netWorthChart(startAge, lastAge)` and `report.exactly(formatRupiah(last))`; area in `--kunyit-bg`; line in `--kunyit-d`, 3.5 wide, `vector-effect: non-scaling-stroke`, drawn in by `pathLength` 0 to 1; a `--sambal` dot with a white ring at `biggestDrop`, labelled `report.drop(age)` on the axis between the start and end ages; aria-label `report.netWorthSummary(firstAge, formatShort(first), lastAge, formatShort(last))`.
  - `WellbeingChart(props: { series: Report['series']; startAge: number; avg: number })`: caption `report.wellbeingChart(...)`; range fixed at 0 to 100; `--sambal-bg` bands from `strainedBands` with `report.shaded` as a legend when any exist; line in `--telang-d`; aria-label `report.wellbeingSummary(avg, final)`.
- Produces: `ReportScreen()`: `h1` `report.done`; `Oren` happy; `report.yourLifeworth` as a small line above the archetype title, an `h2` (`report.archetype[key]`); four `.stat-tile`s, each `role="group"` with `aria-label` = its tile name: Net worth (header `--kunyit` with Ink text, value `formatShort` in `--kunyit-text`, then `rankBand(netWorthPct)`), Wellbeing (header `--telang-d` with white text, value `wellbeingFinal` in `--telang-d`, then the feeling word), Decisions (header `--pandan` with Ink text, value the letter in `--pandan-d`, then `report.calls(n)`), Luck (header `--ubi-d` with white text, value `rankBand(luckPct)` in `--ubi-d`); the relationships line; both charts; `report.best` and `report.worst` lines using the chosen choice's label (worst omitted when it is the same decision as best, both omitted with no decisions); a `.btn` `report.again` calling `quit`. The report is `buildReport(run.state, PERCENTILE_TABLES)` in a `useMemo`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/ui/report/chart-math.test.ts
it('scales values into the box', () => {
  expect(toPoints([0, 50, 100], 260, 80)).toEqual([{ x: 0, y: 80 }, { x: 130, y: 40 }, { x: 260, y: 0 }]);
  expect(toPoints([-100, 100], 260, 80)).toEqual([{ x: 0, y: 80 }, { x: 260, y: 0 }]);
  expect(toPoints([50], 260, 80, { min: 0, max: 100 })).toEqual([{ x: 0, y: 40 }]);
});
it('builds line and area paths', () => {
  const pts = [{ x: 0, y: 80 }, { x: 130, y: 40 }, { x: 260, y: 0 }];
  expect(linePath(pts)).toBe('M0 80 L130 40 L260 0');
  expect(areaPath(pts, 80)).toBe('M0 80 L130 40 L260 0 V80 H0 Z');
});
it('finds the biggest drop and the strained years', () => {
  expect(biggestDrop([10, 30, 12, 40, 35])).toBe(2);
  expect(biggestDrop([1, 2, 3])).toBeNull();
  expect(strainedBands(['oke', 'capek', 'burnout', 'oke', 'capek'])).toEqual([{ start: 1, end: 2 }, { start: 4, end: 4 }]);
});

// src/ui/screens/ReportScreen.test.tsx
const finished = (): { game: Game; report: Report } => {
  const run = playToEnd('report-demo', CONTENT, pickFor('balanced'));
  return { game: { run, screen: { name: 'report' }, startWorth: 0 }, report: buildReport(run.state, PERCENTILE_TABLES) };
};

it('reveals the whole life', () => {
  const { game, report } = finished();
  renderWithStore(<ReportScreen />, { game });
  const s = STRINGS.en.report;
  expect(screen.getByRole('heading', { level: 1, name: s.done })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: s.archetype[report.archetype] })).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'Net worth' })).getByText(formatShort(report.netWorth, 'en'))).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'Wellbeing' })).getByText(String(report.wellbeingFinal))).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'Decisions' })).getByText(report.grade)).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'Luck' })).getByText(rankBand(report.luckPct))).toBeInTheDocument();
  expect(screen.getByText(s.relationships[report.relationships])).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /^Net worth went from/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /^Average wellbeing/ })).toBeInTheDocument();
  if (report.best) {
    const card = CONTENT.find((c) => c.id === report.best!.cardId)!;
    const label = card.choices!.find((c) => c.id === report.best!.choiceId)!.copy.en.label;
    expect(screen.getByText(s.best(report.best.age, label))).toBeInTheDocument();
  }
});
it('starts another life', async () => {
  const { store, user } = renderWithStore(<ReportScreen />, { game: finished().game });
  await user.click(screen.getByRole('button', { name: 'Live another life' }));
  expect(store.getState().game).toBeNull();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/report src/ui/screens/ReportScreen.test.tsx`
Expected: FAIL, cannot resolve `./chart-math` and `./ReportScreen`.

- [ ] **Step 3: Implement `chart-math.ts`, `charts.tsx`, `report.css` and `ReportScreen`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/ui` then `npm run typecheck`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat: add the end report with net worth and wellbeing charts"
```

---

### Task 15: App shell and full-life tests

**Files:**
- Create: `src/ui/ErrorBoundary.tsx`, `src/ui/screens/ErrorScreen.tsx`
- Modify: `src/ui/App.tsx` (replace the placeholder), `src/main.tsx`
- Test: `src/ui/App.test.tsx`, `src/ui/ErrorBoundary.test.tsx`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `ErrorBoundary(props: { onReset(): void; fallback: (reset: () => void) => ReactNode; children: ReactNode })`: a class component; `reset` clears its error and calls `onReset`.
  - `ErrorScreen(props: { onReset(): void })`: `Oren` shocked, `h1` `error.title`, `error.body`, a `.btn` `error.action`.
  - `App()`: inside `MotionRoot`; sets `document.documentElement.lang` to `id` for Jaksel and `en` otherwise; renders `<main className="app" inert={panel !== null}>` holding, inside `ErrorBoundary` (`onReset` = `quit`), `ErrorScreen` when `failed`, `Welcome` with no game, else the screen for `game.screen.name`. After `main`, `AnimatePresence` holds `MenuPanel` or `WalletPanel` (the wallet only with a game).
  - `src/main.tsx`: `createAppStore({ content: CONTENT, storage: browserStore(), newSeed })` at module level, rendered as `<StrictMode><AppStoreProvider store={store}><App /></AppStoreProvider></StrictMode>`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/App.test.tsx
/** One player action: pick the first option and confirm, or press the last button on screen. */
async function step(user: UserEvent, s: Strings): Promise<void> {
  const choose = screen.queryByRole('button', { name: s.card.choose });
  if (choose) {
    await user.click(screen.getAllByRole('radio')[0]!);
    await user.click(choose);
    return;
  }
  await user.click(screen.getAllByRole('button').at(-1)!);
}

it.each(['en', 'jaksel'] as const)('plays a whole life in %s and starts another', async (locale) => {
  const s = STRINGS[locale];
  const { user } = renderWithStore(<App />, { locale, seed: 'app-life' });
  for (let i = 0; i < 800 && !screen.queryByRole('heading', { name: s.report.done }); i++) await step(user, s);
  expect(screen.getByRole('heading', { name: s.report.done })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: s.report.again }));
  expect(screen.getByRole('button', { name: s.welcome.start })).toBeInTheDocument();
}, 60_000);

it('reopens the same outcome sheet after a refresh', async () => {
  const storage = memoryStore();
  const first = renderWithStore(<App />, { storage, seed: 'app-refresh' });
  for (let i = 0; i < 3; i++) await step(first.user, STRINGS.en);
  expect(screen.getByText('Everything goes to savings. Boring, safe.')).toBeInTheDocument();
  first.unmount();
  renderWithStore(<App />, { storage, seed: 'unused' });
  expect(screen.getByText('Everything goes to savings. Boring, safe.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
});

it('opens on the welcome screen over a corrupt save', () => {
  renderWithStore(<App />, { storage: memoryStore({ [SAVE_KEY]: '{"v":1,"locale":' }) });
  expect(screen.getByRole('button', { name: 'Start my life' })).toBeInTheDocument();
});

it('switches every visible string mid-run from the menu and saves the choice', async () => {
  const storage = memoryStore();
  const { user } = renderWithStore(<App />, { storage, game: atCard('app-lang', CONTENT, 'japan_trip') });
  await user.click(screen.getByRole('button', { name: 'Menu' }));
  await user.click(screen.getByRole('radio', { name: 'Jaksel' }));
  await user.click(screen.getByRole('button', { name: 'Lanjut main' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('Grup chat udah mau booking Jepang buat April. Rp18 jt per orang. Lo ikut gak?')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pilih' })).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('id');
  expect(JSON.parse(storage.getItem(SAVE_KEY)!).locale).toBe('jaksel');
});

it('answers a card and works the wallet with the keyboard alone', async () => {
  const { user } = renderWithStore(<App />, { game: atCard('app-keys', CONTENT, 'japan_trip') });
  screen.getByRole('radio', { name: /Go to Bali instead/ }).focus();
  await user.keyboard(' ');
  screen.getByRole('button', { name: 'Choose' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  const pill = screen.getByRole('button', { name: /Open wallet/ });
  pill.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('dialog', { name: 'Wallet' })).toBeInTheDocument();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(pill).toHaveFocus();
});

it('shows the error screen when a card breaks, then starts over', async () => {
  const broken = CONTENT.map((c) => (c.id === 'japan_trip'
    ? { ...c, choices: c.choices!.map((ch) => ({ ...ch, effect: () => { throw new Error('bad card'); } })) }
    : c));
  const { user } = renderWithStore(<App />, { content: broken, game: atCard('app-error', broken, 'japan_trip') });
  await user.click(screen.getByRole('radio', { name: /Go to Bali instead/ }));
  await user.click(screen.getByRole('button', { name: 'Choose' }));
  expect(screen.getByRole('heading', { name: 'Something broke.' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Start a new life' }));
  expect(screen.getByRole('button', { name: 'Start my life' })).toBeInTheDocument();
});

// src/ui/ErrorBoundary.test.tsx
it('catches a render error, shows the fallback and recovers on reset', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  let explode = true;
  function Bomb() { if (explode) throw new Error('boom'); return <p>fine</p>; }
  const onReset = vi.fn(() => { explode = false; });
  const user = userEvent.setup();
  render(<ErrorBoundary onReset={onReset} fallback={(reset) => <button type="button" onClick={reset}>Reset</button>}><Bomb /></ErrorBoundary>);
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(onReset).toHaveBeenCalledTimes(1);
  expect(screen.getByText('fine')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/App.test.tsx src/ui/ErrorBoundary.test.tsx`
Expected: FAIL, the placeholder `App` has no game screens and `./ErrorBoundary` does not exist.

- [ ] **Step 3: Implement `ErrorBoundary`, `ErrorScreen`, `App` and the store wiring in `main.tsx`**

- [ ] **Step 4: Run to verify they pass**

Run: `npm test` then `npm run typecheck`
Expected: every test passes, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui src/main.tsx
git commit -m "feat: wire the app shell with error recovery and full-life tests"
```

---

### Task 16: Phone check, bundle budget and docs

**Files:**
- Modify: `README.md`, `CLAUDE.md`, plus whatever the phone pass needs to fix

- [ ] **Step 1: Full verification**

Run: `npm run typecheck`, `npm test`, `npm run coverage`
Expected: no type errors; every test passes; coverage meets 80% for lines, branches, functions and statements across `src/engine`, `src/app` and `src/ui`.

- [ ] **Step 2: Bundle budget**

Run: `npm run build`
Expected: the entry JS chunk is under 150 kB gzip in Vite's report, and the only fonts emitted are the three Nunito latin woff2 files.

- [ ] **Step 3: Phone pass in a real browser**

Use the `run` skill to start `npm run dev` and drive Chrome with mobile emulation at 360 by 780, then 320 by 640. Play at least five cards in English and five in Jaksel. Expected:
- No horizontal scroll at 320px, including the top bar showing Burnt out and a long money value, and a 20-character nickname typed on the welcome screen.
- Menu and money buttons, tiles and buttons are at least 44px tall.
- Tab shows the Telang focus ring on every control in order; Escape closes Dompet and the menu.
- A luck card flips the coin, lands it, then slides the sheet up; with DevTools' emulated `prefers-reduced-motion: reduce` the coin sits still and the sheet shows at once.
- Refreshing on the outcome sheet brings the same sheet back.
- The report's charts and tiles render, and the drop marker sits on the line.

Fix any defect found, with a test where the defect is testable, then rerun Step 1.

- [ ] **Step 4: Update the docs**

`README.md`: add a Game section with `npm run dev` (play locally), `npm run build` (typecheck, then build to `dist/`) and `npm run preview`.

`CLAUDE.md`: set Plan 2 to done with the date and the test count; add `dev`, `build` and `preview` to the commands; describe `src/app` (pure flow, versioned saves, store) and `src/ui` (screens, string table, Motion through `LazyMotion` strict) in the architecture; add to Plan 3's carry-forward: per-choice reason copy to replace the generic situation line in the grade box, a moment for every card, and owner review of the UI Jaksel strings, archetype names and job titles if the plan review did not settle them; add to Plan 4's: the share and challenge buttons go above `report.again` on the report, the nickname is already saved, fonts are already self-hosted, and the `LazyMotion` strict setup stays.

- [ ] **Step 5: Commit**

```bash
git add README.md CLAUDE.md src
git commit -m "docs: record Plan 2 status and how to run the game"
```

After the last task: one whole-branch review on the most capable model, then `superpowers:finishing-a-development-branch`. Push only when Bro asks.
