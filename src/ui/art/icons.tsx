import type { ReactElement } from 'react';
import type { MomentKind } from '../../engine';

const INK = '#2F3B45';

export function CloseIcon() {
  return (
    <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
      <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#FFC21A" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#E0A100" strokeWidth="2.2" />
    </svg>
  );
}

const GLYPHS: Readonly<Record<MomentKind, ReactElement>> = {
  story: (
    <>
      <circle cx="18" cy="18" r="11" fill="none" stroke={INK} strokeWidth="2.5" />
      <circle cx="18" cy="15.5" r="3.5" fill={INK} />
      <path d="M11.5 24.5 Q18 18 24.5 24.5 Z" fill={INK} />
    </>
  ),
  chat: <path d="M9 10 H27 A3 3 0 0 1 30 13 V21 A3 3 0 0 1 27 24 H17 L12 28 V24 H9 A3 3 0 0 1 6 21 V13 A3 3 0 0 1 9 10 Z" fill={INK} />,
  bank: (
    <>
      <rect x="7" y="11" width="22" height="15" rx="3" fill="#E0A100" />
      <rect x="7" y="15" width="22" height="3" fill={INK} />
    </>
  ),
  email: (
    <>
      <rect x="7" y="11" width="22" height="15" rx="2.5" fill="none" stroke={INK} strokeWidth="2.5" />
      <path d="M8.5 12.5 L18 20 L27.5 12.5" fill="none" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  ),
  notif: (
    <>
      <path d="M18 8 A7 7 0 0 1 25 15 V20 L27.5 23.5 H8.5 L11 20 V15 A7 7 0 0 1 18 8 Z" fill={INK} />
      <circle cx="18" cy="27" r="2.5" fill={INK} />
    </>
  ),
};

export function MomentIcon({ kind }: { kind: MomentKind }) {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#E3E7EA" />
      {GLYPHS[kind]}
    </svg>
  );
}
