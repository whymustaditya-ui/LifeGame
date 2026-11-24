import type { WellbeingLevel } from '../../engine';

/** The crack deepens as wellbeing falls; Seger is whole (spec 5.3). */
const CRACKS: Readonly<Record<WellbeingLevel, string | null>> = {
  seger: null,
  oke: 'M12 6 L10.8 9',
  capek: 'M12 6 L10.6 9.5 L13 12 L11.4 15',
  burnout: 'M12 6 L10.6 9.5 L13 12 L11.4 15 L12 21',
};

export function Heart({ level }: { level: WellbeingLevel }) {
  const crack = CRACKS[level];
  return (
    <svg className="heart" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 21s-8.5-5.2-10.4-10.6C.3 6.6 3 3 6.8 3c2.2 0 4 1.2 5.2 3 1.2-1.8 3-3 5.2-3C21 3 23.7 6.6 22.4 10.4 20.5 15.8 12 21 12 21z"
        fill="var(--sambal)"
      />
      {crack && <path data-crack d={crack} stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </svg>
  );
}
