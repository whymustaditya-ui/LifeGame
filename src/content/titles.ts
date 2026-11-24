import type { Education } from '../engine';

/** Job titles per education track. Jakarta offices use English titles, so both languages share them. */
const LADDERS: Readonly<Record<Education, readonly [string, ...string[]]>> = {
  highschool: ['Admin staff', 'Senior admin staff', 'Team lead', 'Supervisor', 'Assistant manager', 'Manager', 'Senior manager'],
  diploma: ['Junior staff', 'Staff', 'Senior staff', 'Supervisor', 'Assistant manager', 'Manager', 'Senior manager'],
  degree: ['Management trainee', 'Associate', 'Senior associate', 'Assistant manager', 'Manager', 'Senior manager', 'Head of department'],
};

const FALLBACK = 'Staff';

/** Title for the engine's `${education}_${level}` key; past the top of the ladder stays at the top. */
export function jobTitle(titleKey: string): string {
  const match = /^(highschool|diploma|degree)_(\d+)$/.exec(titleKey);
  if (!match) return FALLBACK;
  const ladder = LADDERS[match[1] as Education];
  const level = Number(match[2]);
  return ladder[Math.min(level, ladder.length - 1)] ?? FALLBACK;
}
