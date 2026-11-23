import { m, useReducedMotion } from 'motion/react';
import { startLuckPercentile } from '../../engine';
import { Oren } from '../art/Oren';
import { rankBand } from '../i18n/format';
import { useApp, useStrings } from '../store';
import './screens.css';

const STAGGER_SECONDS = 0.15;

/** The birth lottery: four rolls the player did not choose, and how lucky that start was (spec 5.2). */
export function Lottery() {
  const game = useApp((st) => st.game);
  const leaveLottery = useApp((st) => st.leaveLottery);
  const s = useStrings();
  const reduce = useReducedMotion();
  if (!game) return null;

  const start = game.run.state.start;
  const l = s.lottery;
  const rows: readonly (readonly [string, string])[] = [
    [l.family, l.familyValue[start.family]],
    [l.education, l.educationValue[start.education]],
    [l.parents, start.supportsParents ? l.parentsValue.yes : l.parentsValue.no],
    [l.temperament, l.temperamentValue[start.temperament]],
  ];

  return (
    <section className="screen">
      <h1 className="screen-title">{l.title}</h1>
      <p className="screen-sub">{l.sub}</p>
      <Oren expression="curious" />
      <dl className="facts">
        {rows.map(([label, value], i) => (
          <m.div
            key={label}
            className="fact"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : i * STAGGER_SECONDS }}
          >
            <dt>{label}</dt>
            <dd>{value}</dd>
          </m.div>
        ))}
      </dl>
      <p className="fact-line">{l.firstJob(start.startAge)}</p>
      <p className="luck-line">{l.luck(rankBand(startLuckPercentile(start.luckPoints)))}</p>
      <div className="actions">
        <button type="button" className="btn" onClick={leaveLottery}>{l.go}</button>
      </div>
    </section>
  );
}
