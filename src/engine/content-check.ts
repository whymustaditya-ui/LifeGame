import type { Card, Choice, Localized, Roll, Trigger } from './types';

export const ALL_TRIGGERS: readonly Trigger[] = [
  'first_salary', 'career_change', 'married', 'child', 'kpr', 'capek', 'pinjol', 'first_job_insurance', 'family_insurance',
];
const LOCALES = ['en', 'jaksel'] as const;
const EM_DASH = String.fromCharCode(0x2014);

function textProblems(where: string, copy: Localized<string> | undefined, field: string): string[] {
  if (!copy) return [];
  return LOCALES.flatMap((loc) => {
    const text = copy[loc];
    if (text.trim() === '') return [`${where}: empty ${field} in ${loc}`];
    if (text.includes(EM_DASH) || text.includes('--')) return [`${where}: ${field} in ${loc} has an em dash or double hyphen`];
    return [];
  });
}

function rollProblems(where: string, roll: Roll | undefined): string[] {
  if (!roll) return [];
  return [...textProblems(where, roll.hit.copy, 'hit copy'), ...textProblems(where, roll.miss.copy, 'miss copy')];
}

function choiceProblems(card: Card, c: Choice): string[] {
  const where = `${card.id}/${c.id}`;
  const hasNote = c.copy.en.note !== undefined || c.copy.jaksel.note !== undefined;
  return [
    ...(card.kind === 'dilemma' && !c.grade ? [`${where}: a dilemma choice needs a grade`] : []),
    ...(!c.roll && !c.result ? [`${where}: a choice without a roll needs a result`] : []),
    ...textProblems(where, { en: c.copy.en.label, jaksel: c.copy.jaksel.label }, 'label'),
    ...(hasNote ? textProblems(where, { en: c.copy.en.note ?? '', jaksel: c.copy.jaksel.note ?? '' }, 'note') : []),
    ...textProblems(where, c.result, 'result'),
    ...rollProblems(where, c.roll),
  ];
}

function cardProblems(card: Card): string[] {
  const choices = card.choices ?? [];
  const n = choices.length;
  const shape = [
    ...(card.kind === 'dilemma' && (n < 2 || n > 3) ? [`${card.id}: a dilemma needs 2 or 3 choices`] : []),
    ...(card.kind === 'feed' && (n < 1 || n > 2) ? [`${card.id}: a feed card needs 1 or 2 choices`] : []),
    ...(card.kind === 'luck' && (!card.roll || n > 0) ? [`${card.id}: a luck card needs a roll and no choices`] : []),
  ];
  return [
    ...shape,
    ...textProblems(card.id, card.copy, 'copy'),
    ...rollProblems(card.id, card.roll),
    ...choices.flatMap((c) => choiceProblems(card, c)),
  ];
}

/** Problems in a content set, each naming the card id or the uncovered trigger. Empty means valid. */
export function validateContent(cards: readonly Card[]): string[] {
  const duplicates = cards
    .filter((c, i) => cards.findIndex((other) => other.id === c.id) !== i)
    .map((c) => `duplicate id ${c.id}`);
  const covered = new Set(cards.flatMap((c) => c.triggers ?? []));
  const uncovered = ALL_TRIGGERS.filter((t) => !covered.has(t)).map((t) => `trigger ${t} has no card`);
  return [...duplicates, ...cards.flatMap(cardProblems), ...uncovered];
}
