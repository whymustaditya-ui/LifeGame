import type { ReactElement } from 'react';
import type { WellbeingLevel } from '../../engine';
import './art.css';

export type OrenExpression = 'curious' | 'happy' | 'shocked' | 'tired' | 'exhausted';

const INK = '#2F3B45';
const SWEAT = <path d="M86 20 q5 7 0 10.5 q-5 -3.5 0 -10.5z" fill="#8FD0FF" />;

/** Body and the curious, shocked and happy faces are verbatim from mockup v3. */
function Body() {
  return (
    <>
      <path d="M80 96 C98 92 99 72 88 66" stroke="#F08A2C" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M24 108 C20 80 30 66 50 66 C70 66 80 80 76 108 Z" fill="#FF9A3C" />
      <ellipse cx="50" cy="95" rx="15" ry="12" fill="#FFE3C4" />
      <ellipse cx="37" cy="107" rx="8" ry="4.5" fill="#FFB56B" />
      <ellipse cx="63" cy="107" rx="8" ry="4.5" fill="#FFB56B" />
      <path d="M17 36 L21 7 Q23 2 28 5 L45 22 Z" fill="#FF9A3C" />
      <path d="M83 36 L79 7 Q77 2 72 5 L55 22 Z" fill="#FF9A3C" />
      <path d="M23 27 L25 12 L35 21 Z" fill="#FFB3B3" />
      <path d="M77 27 L75 12 L65 21 Z" fill="#FFB3B3" />
      <ellipse cx="50" cy="42" rx="36" ry="30" fill="#FF9A3C" />
      <path d="M44 14 Q45 19 44 24 M50 13 V24 M56 14 Q55 19 56 24" stroke="#E0731C" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="50" cy="55" rx="16" ry="11" fill="#FFE3C4" />
      <path d="M46 50 H54 L50 54 Z" fill="#FF7A8A" />
    </>
  );
}

const FACES: Readonly<Record<OrenExpression, ReactElement>> = {
  curious: (
    <>
      <g className="oren-blink">
        <ellipse cx="36" cy="40" rx="9" ry="10" fill="#fff" />
        <ellipse cx="64" cy="40" rx="9" ry="10" fill="#fff" />
        <circle cx="40" cy="41" r="5" fill={INK} />
        <circle cx="68" cy="41" r="5" fill={INK} />
        <circle cx="42" cy="39" r="1.8" fill="#fff" />
        <circle cx="70" cy="39" r="1.8" fill="#fff" />
      </g>
      <path d="M50 54 Q47 59 44 57 M50 54 Q53 59 56 57" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  ),
  shocked: (
    <>
      <ellipse cx="36" cy="39" rx="10" ry="11" fill="#fff" />
      <ellipse cx="64" cy="39" rx="10" ry="11" fill="#fff" />
      <circle cx="36" cy="40" r="3.2" fill={INK} />
      <circle cx="64" cy="40" r="3.2" fill={INK} />
      <ellipse cx="50" cy="60" rx="4.5" ry="5.5" fill={INK} />
      {SWEAT}
    </>
  ),
  happy: (
    <>
      <path d="M28 42 Q36 33 44 42 M56 42 Q64 33 72 42" stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M42 56 Q50 66 58 56 Z" fill={INK} />
      <ellipse cx="27" cy="52" rx="5" ry="3" fill="#FF8A8A" opacity=".6" />
      <ellipse cx="73" cy="52" rx="5" ry="3" fill="#FF8A8A" opacity=".6" />
    </>
  ),
  tired: (
    <>
      <path d="M27 40 A9 7 0 0 0 45 40 Z" fill="#fff" />
      <path d="M55 40 A9 7 0 0 0 73 40 Z" fill="#fff" />
      <circle cx="37" cy="43" r="3.5" fill={INK} />
      <circle cx="65" cy="43" r="3.5" fill={INK} />
      <path d="M26 40 H46 M54 40 H74" stroke="#E0731C" strokeWidth="3" strokeLinecap="round" />
      <path d="M45 58 H55" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  exhausted: (
    <>
      <path d="M28 44 L44 41 M56 41 L72 44" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M30 49 Q36 52 42 49 M58 49 Q64 52 70 49" stroke="#E0731C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M43 60 Q46.5 57 50 60 Q53.5 63 57 60" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {SWEAT}
    </>
  ),
};

const BY_LEVEL: Readonly<Record<WellbeingLevel, OrenExpression>> = {
  seger: 'happy', oke: 'curious', capek: 'tired', burnout: 'exhausted',
};

export function orenFor(level: WellbeingLevel): OrenExpression {
  return BY_LEVEL[level];
}

type Props = { expression: OrenExpression; size?: number };

/** Oren, the kucing oren. Flat SVG, no outlines, decorative. */
export function Oren({ expression, size = 84 }: Props) {
  return (
    <svg className="oren" viewBox="0 0 100 110" width={size} height={(size * 110) / 100} aria-hidden="true" data-expression={expression}>
      <Body />
      <g data-face>{FACES[expression]}</g>
    </svg>
  );
}
