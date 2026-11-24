# Lifeworth: design

Status: draft for owner review, 2026-11-23
Repo: https://github.com/whymustaditya-ui/LifeGame (branch `main`)
Working name: Lifeworth (the repo is still called LifeGame)

## 1. Intent

Lifeworth is a 5 to 10 minute life simulation played in the browser on a phone. Each player gets a different, randomly rolled starting line in Indonesia, lives from their first job to age 60 through money decisions, life events and social pressure, and ends with a report that separates how well they decided from how lucky they were. The report is built to be shared on Instagram stories and WhatsApp.

It is inspired by The Woke Salaryman: starting points and luck are unequal, psychology drives money behaviour, and money is a tool for a good life rather than the score.

Why it exists: the owner wants a fun game that makes people feel the real trade-offs of adult life (work-life balance, risky investments, staying frugal while friends post overseas trips and the FOMO builds) and then shows them how good their decisions actually were. Success looks like friends sharing their reports and challenging each other on the same starting line.

Audience: Indonesian 20-somethings who live on their phones, starting with the owner's own circle.

## 2. Goals, non-goals, anti-goals

Goals
- A complete run takes 5 to 10 minutes on a phone.
- Every player gets a different starting line, and the game tells them how lucky that start was.
- Decisions are graded on the situation the player could see when they made them, never on how they turned out.
- Wellbeing matters as much as money, mechanically, the way it does in real life.
- The end report is worth a screenshot, with a one-tap share and a same-start challenge link.
- Two complete language versions: English and Jaksel.
- Production grade: tested engine, accessible, fast on a mid-range Android phone, no generic AI look or copy.

Non-goals for v1
- Accounts, logins, a backend or a database.
- Rankings against real players, or a custom link preview per shared result.
- Native apps or app store listings.
- AI-generated events or copy at runtime.
- Real financial advice. The game simplifies on purpose.
- A standing wallet panel for changing plans outside cards (possible later).
- Monetization.

Anti-goals (a failure even if it technically works)
- It lectures. Lessons arrive through consequences and the report, never through sermons.
- Pure money maximizing wins. If hoarding every rupiah produces the best report, the design has failed.
- Punishments feel random. Every bad spiral shows visible warning signs first.
- The UI nudges answers. All choices in a dilemma look identical.
- It looks or reads like generic AI output: emoji icons, gradients, stock phrasing, Jaksel that sounds translated.
- Runs drag past 10 minutes, or end before the player feels they lived a life.

## 3. Decisions made with the owner

| Topic | Decision |
|-|-|
| Platform | Web only, phone-first, playable in any mobile browser, installable to the home screen (PWA). No app stores. |
| Setting | Indonesia: Rupiah, Jakarta salaries, BPJS, KPR, THR, pinjol, mudik, "kapan nikah?", the sandwich generation. |
| Languages | Two versions, English and Jaksel, each written as its own script, not translated. |
| Grading | Judge the decision, not the result. Each dilemma is graded when it is made, against the situation the player could see. |
| Luck | Tracked separately from decisions and shown in the report as a percentile. |
| Start | A birth lottery with real variety, including no degree and a poor family, not only fresh graduates. |
| Wellbeing | Mechanically important: low wellbeing hurts productivity, raises the chance of getting fired, makes bad events more likely and strains relationships. |
| Wellbeing display | Shown as a feeling during play, never as a number. The real numbers appear in the report. |
| Relationships | Hidden during play, surfaced through people and events, revealed in the report. |
| Decision flow | Cards only, for now. Every decision comes through a card, and some cards are guaranteed so the player is always offered the moment that matters (5.5). A standing wallet panel may come later. |
| Visibility rule | Anything you could check in real life (balances, debts, insurance, job title) is visible; anything you can only feel (wellbeing, relationships, job security) is hidden during play. |
| Style | Duolingo style, from approved mockup v3 (section 6). |
| Mascot | Oren, a kucing oren. An original character. |
| Name | Lifeworth (working name, replaces LifeGame). |
| Stack | Option A: Vite + React + TypeScript, static, no backend for v1 (section 4). |
| Repo | github.com/whymustaditya-ui/LifeGame |

## 4. Approaches considered

**A. Vite + React, static, no backend (chosen).** The whole game runs on the phone. It is the owner's proven stack (Prometheus Finance and SpendLens both use Vite, React 19, TypeScript, Zustand and Vitest). Challenge links carry the seed, so no database is needed. Percentiles come from simulated lives computed at build time. Trade-off: every shared link shows the same preview image, and there are no rankings against real players.

**B. Astro + React islands.** Strong for content sites and SEO, but here it would wrap one large React island and add a second framework to learn without changing anything a player sees. Worth revisiting only if a content site grows around the game.

**C. Vite + React + FastAPI.** Adds real-player rankings, saved results and per-result link previews, at the cost of a server to host, pay for and keep alive. Deferred: it can be added later without rewriting the client.

Also dropped: Next.js (server rendering is not needed), game engines such as Phaser (this game is cards, text and charts, and the DOM serves bilingual text and accessibility better), and native apps (web was required).

## 5. The game

### 5.1 A run at a glance

1. Choose a language (English or Jaksel) and, optionally, a nickname used only on the share card.
2. Birth lottery reveal.
3. Play the years from start age to 60. Each year shows zero to two cards, then a short year recap. Guaranteed cards (5.5) take a slot first; random cards fill the rest.
4. Final report, share card and challenge link.

Pacing target: about 18 to 24 dilemmas and 8 to 12 luck events per run, 15 to 25 seconds per card. Quiet years fast-forward through the recap. Life is grouped into stages that decide which cards can appear: early career (start age to 29), building (30 to 39), sandwich and peak (40 to 49), and pre-retirement (50 to 60).

### 5.2 Birth lottery

Four rolls the player does not choose:
- **Family money:** poor, middle or rich. Affects starting cash, whether family can help in a crisis, and obligations.
- **Education:** high school, diploma or degree. Sets the start age (18, 21 or 22) and the salary track. Weighted by family money, so the rolls correlate the way they do in real life.
- **Supporting parents:** yes or no, for example Rp2 million a month. More likely with a poor family.
- **Temperament:** anxious, impulsive or steady. Changes how hard stress and FOMO hit, and how tempting impulsive options are. Temperament is luck; how you play it is the decision.

The reveal shows how lucky the start was ("bottom 20% of starts"). The starting rolls count toward the luck score.

### 5.3 State

The rule: anything you could check in real life is visible, and anything you can only feel stays hidden.

Visible during play
- **Money:** short Rupiah net worth in the top bar (Rp8.4B, so it fits a 320px phone). Tapping it opens a read-only wallet sheet (Dompet) with exact cash, the emergency fund in months of expenses, investments, debts and insurance cover. Exact there, because in real life you can check all of these.
- **Job title and income,** shown in the year recap.
- **Wellbeing as a feeling,** in four levels: Seger, Oke, Capek, Burnout (English: Great, Okay, Tired, Burnt out). The heart icon cracks as it falls, and Oren's expression and the copy reinforce it.
- **Age,** on the life progress bar.

Hidden during play, revealed in the report
- The wellbeing score, 0 to 100.
- Relationships: an overall support score plus the state of a few named people (Mama or family, a partner if any, a close friend).
- Job security, signalled through events (layoff rumours, a bad performance review) rather than shown.

### 5.4 Economy

All amounts are in today's money (inflation-adjusted Rupiah), so numbers stay intuitive across 40 years, and investment returns are real returns.
- **Each year:** income minus living costs minus obligations equals savings.
- **Income:** set by the education track and career level. Raises and promotions depend on performance, and performance depends on wellbeing.
- **Living costs:** set by lifestyle level. Choices like moving out, buying a car or a big wedding raise it, so lifestyle creep is a mechanic.
- **Assets:** cash and emergency fund, an index-fund style investment (moderate real return with volatility), risky bets (high variance), and property bought with a KPR (equity builds over time).
- **Debt:** pinjol (very high interest), credit cards, KPR.
- **Protection:** BPJS Kesehatan as the baseline, optional private insurance, and the emergency fund. Protection decides how hard luck events hit: a hospital bill is a dent with savings and insurance, and pinjol debt without them.
- **Anchor for tuning:** the Jakarta minimum wage was about Rp5.4 million a month in 2025. Every salary, price, return and odds value is tuning data that the builder researches and keeps in one config module.

### 5.5 Cards

Three kinds:
- **Dilemma:** two or three choices, each with costs, effects and a grading rule. Example: the group chat is booking Japan for April at Rp18 million each; the choices are book it, Bali instead for Rp6 million, or skip it and keep saving.
- **Luck event:** happens to you. It has odds (which may depend on state), outcomes, and an expected value used for luck scoring. Examples: a layoff, a parent's hospital bill, a market crash, an inheritance, a promotion, a friend's kopi susu shop closing after you invested in it.
- **Feed post:** a friend's IG story or a group chat message (a trip, a new car, a wedding). It drains wellbeing unless the player feels secure, and some posts lead into a "keep up" spending dilemma.

**Guaranteed cards.** Some moments are never left to the dice. They are chosen by rule from the state, not drawn at random:
- **Money plan:** at the first salary and at each raise, promotion, job loss, marriage, child or KPR, the player picks where leftover money goes each year (for example save it all, half into an index fund, or invest most of it). The choice keeps applying until the next money plan card, and it is graded like any dilemma.
- **Recovery:** once wellbeing reaches Capek, a recovery card (take leave, see a therapist, quit, talk to someone) appears within a year and comes back every year the player stays at Capek or Burnout. Declining it repeatedly is what "ignoring warnings" means in 5.7.
- **Debt and protection:** a pinjol payoff card appears while pinjol debt exists, and an insurance card appears at the first job and again at marriage or a first child.

Every card has eligibility conditions (age band and state, such as married, has a KPR, or family money), a weight, and copy in both languages. Cards render as the real phone moment they come from (an IG story, a WhatsApp chat, a bank alert, an HR email) inside the Duolingo-style frame.

### 5.6 Wellbeing rules

| Level | Work | Luck | Relationships |
|-|-|-|-|
| Seger / Great (70+) | promotion odds up | good breaks more likely | people grow closer |
| Oke / Okay (40 to 69) | normal | normal | steady |
| Capek / Tired (20 to 39) | output drops, raises stall | sickness, impulse buys and scams more likely | arguments, friends drift away |
| Burnout (under 20) | a real chance of getting fired each year | all of the above, worse | breakups, family strain |

- **It spirals both ways.** Low wellbeing hurts work, which hurts money, which hurts wellbeing. Getting out costs something real: a break means unpaid leave, therapy costs money, quitting a toxic job costs income. High wellbeing spirals the other way, through better work, raises and good breaks.
- **Warnings come before punishment.** Oren looks exhausted, the heart cracks, a burnout warning appears, and the copy carries body signals ("udah 3 minggu tidur 5 jam") before getting fired or a breakup becomes possible.
- **Strong relationships cushion a crisis:** a family loan, a friend's job referral, a partner's second income.
- The exact thresholds and multipliers are tuning values.

### 5.7 Decision grading

- Every dilemma choice has a grading rule, evaluated at decision time using only what the player could see (5.3): everything in the wallet sheet (emergency fund in months, debts, insurance, investments), the wellbeing level (the feeling, not the hidden number), dependents and life stage. The engine hands grading rules a visible-state snapshot, never the full state.
- Each decision gets a grade on a five-step scale. The run's overall grade is a letter from A to E with plus and minus.
- Example: putting Rp10 million into a friend's kopi susu shop with a 6-month emergency fund and 8% of net worth at risk is "masuk akal" even if it goes rugi. The same bet with no emergency fund grades poorly even if it pays off.
- Ignoring visible warnings counts against decisions, for example three years at Capek without taking a break.

### 5.8 Luck accounting

- The luck score measures how the dice landed against the odds at the time: for each luck event, the actual outcome value minus the expected value given the odds then.
- Odds the player raised through their own state (burnout raising the chance of sickness) do not count as bad luck, because the expected value already includes them.
- The starting rolls contribute to luck.
- The luck percentile comes from a distribution of simulated runs (5.11).

### 5.9 Seeds and determinism

- Every run has a seed, which determines the birth lottery and every random draw.
- Random draws are keyed by year, stream and index (for example the card-deal stream and the luck-outcome stream), never by screen position, so different choices and guaranteed cards never shift the random stream. Two players with the same seed face the same dice; only their decisions, and the odds those decisions shaped, differ. If a guaranteed card takes the last slot of a year, the random card it displaces is simply not dealt; that is a consequence of the player's state, not a change in the dice.
- The challenge link encodes the seed, the language and the sharer's headline results (nickname, archetype, grade), for example `/c/<code>`.
- A run in progress is saved to localStorage, so a refresh does not lose it.

### 5.10 The report

- **Header:** "You made it to 60" plus an archetype title, for example "Rich but tired", "Broke but happy", "Steady compounder", "Lucky gambler", "Sandwich hero". About 8 to 10 archetypes, derived from the net worth percentile, wellbeing, decision grade and luck.
- **Stat tiles:** net worth (exact, plus percentile), wellbeing (revealed), decisions (letter grade), luck (percentile). A relationships status line.
- **Charts:** net worth over age, and the revealed wellbeing line, with event markers such as a crash at 38 or the burnout years.
- **Best call and worst call,** one line each.
- **Actions:** share as an image, and challenge a friend with a link.
- **Share card:** rendered on the device as a 1080 by 1920 PNG for IG stories, shared through the phone's native share sheet (the Web Share API with files), with a download fallback.

### 5.11 Percentiles without a backend

A build-time script simulates a large number of runs (target 100,000) using a mix of scripted player styles and writes compact distribution tables (net worth, luck, grade) as JSON that ships with the app. The report looks up percentiles from those tables.

## 6. Look and feel

Reference mockup (approved): `docs/superpowers/specs/assets/2026-11-23-mockup-v3.html`. Its top bar still shows wellbeing as a number; the feeling display in 5.3 replaces that. The report revealing wellbeing as a number is correct.

- **Type:** Nunito at 700, 800 and 900. Primary buttons are uppercase with slight letter spacing; everything else is sentence case.
- **Colour tokens,** named after Indonesian kitchen staples, each with one job:
  - Pandan `#3CC46B`, dark `#2A9A51`: go, confirm, untung
  - Telang `#1E9BF0`, dark `#1478C2`, tint `#DDF1FF`: the player's current selection
  - Sambal `#FF4D4F`, dark `#D93A3C`, tint `#FFE5E5`: rugi, danger
  - Kunyit `#FFC21A`, dark `#E0A100`: money
  - Ubi `#A46BF5`, dark `#7E4BD1`: luck
  - Ink `#2F3B45`, muted `#77838C`, line `#E3E7EA`, paper `#FFFFFF`
- **Components:** chunky buttons and choice tiles with a 4px bottom edge and 16px radius; select, then confirm; a feedback sheet that slides up (red for rugi, green for untung) with the decision grade shown separately; a life progress bar with a highlight stripe; lesson-complete style stat tiles in the report.
- **Oren:** flat SVG, no outlines. Expressions needed at minimum: curious, happy, shocked, tired, exhausted.
- **Motion:** the Motion library. The coin flip that reveals luck is the one showpiece; everything else answers a tap (button press, sheet, count-ups). Respect `prefers-reduced-motion`.
- **Rules:** no emoji as icons, no gradients, no drop shadows (depth comes from the bottom edges), and choices within a dilemma are always styled identically.
- **Sound:** optional for v1, and muted by default if included.

### 6.1 Voice

- English and Jaksel are written side by side as two scripts with the same meaning, never one translated from the other.
- Jaksel mixes languages the way Jakarta 20-somethings actually talk (gue/lo, "which is", "literally", "healing", "boncos"), with English woven into Indonesian sentences.
- Humour is dry and comes from specific detail, not exaggeration. Minimal exclamation marks, one laugh at most, no AI-speak.
- Copy names things the way players would ("tabungan", "dana darurat"), never the way the engine does.

## 7. Technical design

- Vite, React 19, TypeScript in strict mode, Zustand for UI and game state.
- **Engine:** a pure TypeScript module with no React imports: seeded PRNG, state transitions, card selection, grading, luck accounting and archetype rules. The UI only renders engine state and sends choices back.
- **Content:** typed data files, one entry per card, with copy keyed by locale (`en`, `jaksel`), validated against a schema in the test suite so a missing translation or a broken condition fails the build.
- **Charts and Oren:** hand-built SVG components, animated with Motion.
- **PWA:** installable, and playable offline after the first load.
- **Share:** the report card is rendered to PNG on the device and shared through the Web Share API with files, with a download fallback.
- **Hosting:** static hosting with a free tier (Cloudflare Pages or Vercel). No server code in v1.
- **Later, without rewrites:** a serverless function or a FastAPI service for real-player stats and per-result link previews.

## 8. Quality bar

- Engine unit tests in Vitest at 80% coverage or higher, including fixed-seed golden runs.
- A Playwright end-to-end test that plays a full fixed-seed run at a phone viewport, in both languages.
- Accessibility: playable by keyboard, visible focus, AA contrast, touch targets of at least 44px, reduced motion respected.
- Performance: Lighthouse mobile score of 90 or higher, a small initial JavaScript bundle, subset fonts.
- Content: every card is hand-written in both languages and reviewed by the owner for the Jaksel voice. No real company names (banks, pinjol apps) in events.
- A one-line note that the game simplifies real life and is not financial advice.

## 9. Constraints

- Mobile Chrome on Android and Safari on iOS, the current and previous major versions.
- The repository is public, so no secrets (none are needed).
- The project lives in OneDrive with `node_modules` inside it, like the owner's other projects. The folder path must never contain `&`, which breaks npm's command shims on Windows.

## 10. Left to the builder

- All tuning numbers: salaries, prices, returns, odds, wellbeing thresholds and multipliers, pacing.
- The full card list within the v1 content target: about 30 dilemmas, 25 luck events and 15 feed posts, each in both languages.
- Archetype names and rules.
- The exact grading rule for each dilemma, within the principles in 5.7.
- Libraries for PNG rendering and the PWA, and the hosting provider.
- Sound effects, if any.
- The domain name (availability not checked yet).

## 11. Calls made by Claude, not the owner

These were proposed during the brainstorm and not objected to, but the owner did not choose them explicitly:
- Relationships modelled as hidden support plus a few named people.
- A read-only wallet sheet (Dompet) behind the money pill, rather than more numbers in the top bar.
- The list of moments that trigger guaranteed cards (5.5).
- Inflation-adjusted Rupiah throughout.
- Per-slot random draws, so choices never desync a shared seed.
- The v1 card counts.
- A five-step decision scale rolled up into a letter grade.
- A 1080 by 1920 share card.
- Autosave to localStorage.
- An optional nickname on the share card.
- No real company names in content.
