import { m, useReducedMotion } from 'motion/react';
import './art.css';

type Face = 'good' | 'bad';

/** Five turns lands the smiling face up; five and a half lands the frown (mockup v3). */
const FINAL_ANGLE: Readonly<Record<Face, number>> = { good: 1800, bad: 1980 };
const FLIP_SECONDS = 1.1;
const LIFT = -44;

const RIM = (
  <>
    <circle cx="50" cy="50" r="48" fill="#E0A100" />
    <circle cx="50" cy="50" r="43" fill="#FFC21A" />
  </>
);
const INK = '#2F3B45';

/** The one showpiece: the coin that reveals luck. Decorative; the sheet carries the result in words. */
export function CoinFlip({ face }: { face: Face }) {
  const reduce = useReducedMotion();
  const final = FINAL_ANGLE[face];
  return (
    <div className="coin-stage" aria-hidden="true">
      <m.div
        className="coin"
        data-coin={face}
        initial={reduce ? false : { rotateY: 0, y: 0 }}
        animate={reduce ? { rotateY: final } : { rotateY: final, y: [0, LIFT, 0] }}
        transition={{ duration: FLIP_SECONDS, ease: [0.2, 0.7, 0.25, 1] }}
        style={reduce ? { rotateY: final } : undefined}
      >
        <div className="coin-face">
          <svg viewBox="0 0 100 100">
            {RIM}
            <circle cx="38" cy="44" r="5" fill={INK} />
            <circle cx="62" cy="44" r="5" fill={INK} />
            <path d="M36 58 Q50 70 64 58" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className="coin-face coin-back">
          <svg viewBox="0 0 100 100">
            {RIM}
            <circle cx="38" cy="46" r="5" fill={INK} />
            <circle cx="62" cy="46" r="5" fill={INK} />
            <path d="M37 66 Q50 56 63 66" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </m.div>
    </div>
  );
}
