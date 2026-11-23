import { m, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { shownCard } from '../../app/flow';
import { levelOf, toVisible, type DecisionScore } from '../../engine';
import { CoinFlip } from '../art/CoinFlip';
import { Oren, orenFor, type OrenExpression } from '../art/Oren';
import { TopBar } from '../components/TopBar';
import { describeOutcome, type Tone } from '../outcome/describe';
import { useApp, useLocale, useStrings } from '../store';
import './screens.css';

/** The sheet waits for the coin to land, as in mockup v3. */
const COIN_SECONDS = 1.1;

const gradeClass = (score: DecisionScore): string => (score >= 4 ? 'grade' : score === 3 ? 'grade grade-mid' : 'grade grade-low');

function expressionFor(tone: Tone, fallback: OrenExpression): OrenExpression {
  if (tone === 'bad') return 'shocked';
  if (tone === 'good') return 'happy';
  return fallback;
}

/** The result of the last choice: the coin for a roll, then the feedback sheet with the grade and the luck line. */
export function OutcomeScreen() {
  const game = useApp((st) => st.game);
  const content = useApp((st) => st.content);
  const leaveOutcome = useApp((st) => st.leaveOutcome);
  const locale = useLocale();
  const s = useStrings();
  const reduce = useReducedMotion();
  const focusRef = useRef<HTMLElement>(null);

  useEffect(() => {
    focusRef.current?.focus();
  }, []);

  const card = game ? shownCard(game, content) : null;
  const result = game?.run.last ?? null;
  if (!game || game.screen.name !== 'outcome' || !card || !result) return null;

  const state = game.run.state;
  const view = describeOutcome({ before: game.screen.before, after: toVisible(state), result, locale });
  const choice = card.choices?.find((c) => c.id === result.choiceId);
  const title = view.coin ? s.outcome.rollTitle(state.age) : s.card.title[card.kind](state.age);
  const sub = choice ? s.outcome.youChose(choice.copy[locale].label) : card.copy[locale];
  const delay = view.coin && !reduce ? COIN_SECONDS : 0;

  return (
    <section className="screen">
      <TopBar />
      <h1 className="screen-title">{title}</h1>
      <p className="screen-sub">{sub}</p>
      <div className="stage">
        <Oren expression={expressionFor(view.tone, orenFor(levelOf(state.wellbeing)))} />
        {view.coin && <CoinFlip face={view.coin} />}
      </div>
      <m.section
        className={`feedback feedback-${view.tone}`}
        aria-label={view.headline ?? undefined}
        initial={reduce ? false : { y: '100%' }}
        animate={{ y: 0 }}
        transition={{ delay, type: 'tween', ease: [0.2, 0.8, 0.2, 1], duration: 0.35 }}
      >
        {view.headline && (
          <h2 tabIndex={-1} ref={(el) => { focusRef.current = el; }}>{view.headline}</h2>
        )}
        {view.message && (
          <p tabIndex={view.headline ? undefined : -1} ref={view.headline ? undefined : (el) => { focusRef.current = el; }}>
            {view.message}
          </p>
        )}
        {view.grade && (
          <div className={gradeClass(view.grade.score)}>
            <b>{view.grade.label}</b>
            {view.grade.situation}
          </div>
        )}
        {view.luckLine && <p className="luck-line">{view.luckLine}</p>}
        <button type="button" className={view.tone === 'bad' ? 'btn btn-danger' : 'btn'} onClick={leaveOutcome}>
          {s.common.continue}
        </button>
      </m.section>
    </section>
  );
}
