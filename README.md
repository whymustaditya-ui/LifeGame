# Lifeworth

A 5 to 10 minute Indonesian life simulation, played in the browser on a phone. Design: `docs/superpowers/specs/2026-11-23-lifeworth-design.md`.

## Game

| Command | What it does |
|-|-|
| `npm run dev` | Plays the game locally |
| `npm run build` | Typechecks, then builds the static site to `dist/` |
| `npm run preview` | Serves the built site |

## Engine

The game logic lives in `src/engine/` as pure TypeScript with no UI. Every random number comes from the run's seed, so any run replays exactly.

| Command | What it does |
|-|-|
| `npm test` | Runs every test |
| `npm run coverage` | Runs the tests with coverage (80% minimum for `src/engine`) |
| `npm run typecheck` | Type-checks the engine and scripts |
| `npm run sim -- --seed demo --style balanced` | Plays one full life in the terminal and prints each year, the grade, the luck percentile and the archetype. Styles: `frugal`, `balanced`, `yolo`, `random` |
| `npm run percentiles -- --runs 2000` | Simulates many lives and rewrites `src/engine/data/percentiles.json` |
