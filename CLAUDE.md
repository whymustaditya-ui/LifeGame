# Lifeworth (repo: LifeGame)

A 5 to 10 minute Indonesian life simulation for phones, played in the browser, in English and Jaksel, Duolingo style. Each player gets a random starting line, makes money and life decisions from their first job to 60, and ends with a shareable report that grades their decisions separately from their luck.

Owner: Bro (Aditya). The workspace rules in the parent `CLAUDE.md` files apply: no em dash or double hyphen in any output, sharp and direct tone, English unless Bro writes in Bahasa first.

## Read first

| File | What it is |
|-|-|
| `docs/superpowers/specs/2026-11-23-lifeworth-design.md` | The approved design. The binding authority for every plan. |
| `docs/superpowers/specs/assets/2026-11-23-mockup-v3.html` | The approved Duolingo-style mockup. Its top bar shows wellbeing as a number; that is superseded, wellbeing shows as a feeling. |
| `docs/superpowers/plans/2026-11-23-lifeworth-engine.md` | Plan 1 (engine), done. Read it for interfaces and pinned tuning values. |
| `src/engine/index.ts` | The engine's public API. The UI uses only this. |

## Status

| Plan | Scope | Status |
|-|-|-|
| 1 Engine | Pure TypeScript game logic, sample cards, CLI simulator, percentile tables | Done. Merged to main 2026-11-23. 73 tests, 95% coverage |
| 2 Game UI | Vite + React app built on the engine: Duolingo-style screens from mockup v3, Oren the mascot, Motion animation, EN and Jaksel toggle, wallet sheet (Dompet), report with charts, autosave | Done on branch `feat/game-ui` 2026-11-23 (plan `docs/superpowers/plans/2026-11-23-lifeworth-game-ui.md`). 174 tests, 97% line coverage, 131 kB gzip JS |
| 3 Content and tuning | About 30 dilemmas, 25 luck events and 15 feed posts in both languages with owner-reviewed Jaksel, balancing, 100,000-run percentile tables | After Plan 2 |
| 4 Share, PWA, release | 1080 by 1920 share card, challenge links (`/c/<code>`), installable PWA, Playwright end-to-end, Lighthouse 90+, static hosting (Cloudflare Pages or Vercel) | Last. This is what makes it live |

## Commands

| Command | What it does |
|-|-|
| `npm run dev` | Plays the game locally (Vite) |
| `npm run build` | Typechecks, then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` |
| `npm test` | Runs every test (Vitest projects `logic` in node, `ui` in jsdom) |
| `npm run coverage` | Tests with coverage, 80% minimum on `src/engine`, `src/app` and `src/ui` |
| `npm run typecheck` | Type-checks the engine, app logic and scripts (no DOM), then the UI |
| `npm run sim -- --seed demo --style balanced` | Plays one full life in the terminal. Styles: frugal, balanced, yolo, random |
| `npm run percentiles -- --runs 2000` | Regenerates `src/engine/data/percentiles.json` |

## Architecture

- `src/engine/`: pure, deterministic TypeScript with no React, DOM or Node imports. Every function returns new objects. Every random number comes from `draw(seed, keyOf(age, stream, id))`, never `Math.random`, so a run replays exactly and saves to localStorage as JSON.
- `src/content/`: cards as typed data with copy in `en` and `jaksel`, plus an optional `moment` (the phone notification a card renders as). `validateContent` must return an empty list for any content set. `CONTENT` in `index.ts` is what the game plays; `titles.ts` maps the engine's title keys to job titles.
- `src/app/`: React-free logic. `flow.ts` is the screen state machine over a `Run` (lottery, card, outcome, recap, report; quiet years fast-forward into one recap). `save.ts` versions saves (`lifeworth.save`, `SAVE_VERSION`) and drops anything it cannot trust. `store.ts` is the Zustand vanilla store: autosave, and actions that ignore a tap on the wrong screen.
- `src/ui/`: React 19 screens and components. All UI copy is in `i18n/strings.ts` (both languages, typed); money formatting in `i18n/format.ts`. Motion only through `m.*` inside `LazyMotion strict` (`motion.tsx`). Colours are tokens in `styles/tokens.css`, guarded by an AA contrast test.
- `scripts/`: the CLI simulator and the percentile generator.
- Grading only ever sees `VisibleState` (what a player could check in real life). Luck is actual minus expected for every roll.

## Carry-forward requirements from the Plan 1 final review

Plan 2 handled all three of its items (versioned saves, wellbeing as a feeling, `run.last` read before `endYear`).

Plan 3 must:
- Write per-choice reason copy for the grade box; today its second line is a generic "at the time" situation line.
- Give every card a `moment`.
- Settle the owner review of the UI Jaksel strings (`src/ui/i18n/strings.ts`), archetype names, sample moments and job titles, if not already done.
- Add lifestyle creep cards (moving out, a car, a wedding, kids, a KPR). Without them the median life ends near Rp6.9B, which is too rich.
- Retune wellbeing so the resting point sits in Oke. Today anxious players rest at Capek.
- Consider per-card keyed draws, so players on the same seed get the same random cards more often.
- Extend `validateContent` to catch duplicate choice ids, NaN or non-positive weights, and roll odds outside 0 to 1.
- Expose a Capek streak in `VisibleState` if a grading rule needs it.
- Regenerate the percentile tables at 100,000 runs on the final content.

Plan 4 notes:
- The share and challenge buttons go above "Live another life" on the report. The nickname is already saved in the store.
- Fonts are already self-hosted (`@fontsource/nunito`, latin 700 to 900). Keep the `LazyMotion strict` setup.
- jsdom is pinned to 29 because this machine runs Node 24.13; jsdom 30+ needs Node 24.15.

## How we work

- Superpowers flow: brainstorming (done), then `superpowers:writing-plans` for each plan, then native execution with `superpowers:executing-plans`, one final whole-branch review on the most capable model, and `superpowers:finishing-a-development-branch`.
- Test first for everything. Watch the test fail before writing the code.
- Work on a feature branch, never directly on main. Push only when Bro asks.
- Copy and UI rules: no em dash or double hyphen, no emoji, no gradients or drop shadows, no real company names. Jaksel is written in its own voice, not translated.
- Conventional commits (`feat:`, `fix:`, `docs:`), no attribution trailer.

## Windows gotchas

- Never put `&` in a path. It breaks npm command shims, which is why the folder is "Games and Fun".
- Very long Bash commands with heredocs fail to parse in this harness. Write big files with the Write tool or split them into smaller calls.
- The shell sets `NODE_TLS_REJECT_UNAUTHORIZED=0` (office network). npm works, but skips certificate checks.
