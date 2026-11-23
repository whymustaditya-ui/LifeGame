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
| 2 Game UI | Vite + React app built on the engine: Duolingo-style screens from mockup v3, Oren the mascot, Motion animation, EN and Jaksel toggle, wallet sheet (Dompet), report with charts, autosave | Next |
| 3 Content and tuning | About 30 dilemmas, 25 luck events and 15 feed posts in both languages with owner-reviewed Jaksel, balancing, 100,000-run percentile tables | After Plan 2 |
| 4 Share, PWA, release | 1080 by 1920 share card, challenge links (`/c/<code>`), installable PWA, Playwright end-to-end, Lighthouse 90+, static hosting (Cloudflare Pages or Vercel) | Last. This is what makes it live |

## Commands

| Command | What it does |
|-|-|
| `npm test` | Runs every test |
| `npm run coverage` | Tests with coverage, 80% minimum on `src/engine` |
| `npm run typecheck` | Type-checks the engine and scripts |
| `npm run sim -- --seed demo --style balanced` | Plays one full life in the terminal. Styles: frugal, balanced, yolo, random |
| `npm run percentiles -- --runs 2000` | Regenerates `src/engine/data/percentiles.json` |

## Architecture

- `src/engine/`: pure, deterministic TypeScript with no React, DOM or Node imports. Every function returns new objects. Every random number comes from `draw(seed, keyOf(age, stream, id))`, never `Math.random`, so a run replays exactly and saves to localStorage as JSON.
- `src/content/`: cards as typed data with copy in `en` and `jaksel`. `validateContent` must return an empty list for any content set.
- `scripts/`: the CLI simulator and the percentile generator.
- Grading only ever sees `VisibleState` (what a player could check in real life). Luck is actual minus expected for every roll.

## Carry-forward requirements from the Plan 1 final review

Plan 2 must:
- Version saved games and start a fresh run on any load error. `deserialize` only checks the shape.
- Show wellbeing as a feeling (Seger, Oke, Capek, Burnout), never a number, until the report.
- Read `run.last` before calling `endYear`, which clears it.

Plan 3 must:
- Add lifestyle creep cards (moving out, a car, a wedding, kids, a KPR). Without them the median life ends near Rp6.9B, which is too rich.
- Retune wellbeing so the resting point sits in Oke. Today anxious players rest at Capek.
- Consider per-card keyed draws, so players on the same seed get the same random cards more often.
- Extend `validateContent` to catch duplicate choice ids, NaN or non-positive weights, and roll odds outside 0 to 1.
- Expose a Capek streak in `VisibleState` if a grading rule needs it.
- Regenerate the percentile tables at 100,000 runs on the final content.

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
