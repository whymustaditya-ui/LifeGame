import type { ChoiceResult, DecisionScore, Locale, VisibleState } from '../../engine';
import { formatDelta, formatMonths } from '../i18n/format';
import { STRINGS } from '../i18n/strings';

export type Tone = 'good' | 'bad' | 'neutral';

export interface OutcomeView {
  tone: Tone;
  coin: 'good' | 'bad' | null;
  headline: string | null;
  message: string | null;
  grade: { score: DecisionScore; label: string; situation: string } | null;
  luckLine: string | null;
}

interface Args { before: VisibleState; after: VisibleState; result: ChoiceResult; locale: Locale }

/** A fair call is ungraded (luck cards) or graded 4 and up. */
const FAIR_SCORE = 4;

/**
 * What the feedback sheet says. The colour follows the luck, never the money, so spending on a trip is not
 * painted as a loss; the grade only describes what the player could see when deciding (spec 5.7).
 */
export function describeOutcome({ before, after, result, locale }: Args): OutcomeView {
  const s = STRINGS[locale].outcome;
  const roll = result.roll;
  const delta = after.netWorth - before.netWorth;
  const amount = formatDelta(delta, locale);
  const message = result.message?.[locale] ?? null;
  const grade = result.score === null ? null : {
    score: result.score,
    label: s.yourCall(s.score[result.score]),
    situation: s.situation(formatMonths(before.emergencyMonths, locale), before.debt.pinjol > 0, before.married || before.children > 0),
  };

  if (!roll) {
    return { tone: 'neutral', coin: null, headline: delta === 0 ? null : amount, message, grade, luckLine: null };
  }

  const isLucky = roll.luck >= roll.expected;
  const isFair = result.score === null || result.score >= FAIR_SCORE;
  const quiet = isLucky ? s.goodQuiet : s.badQuiet;
  const headline = delta > 0 ? s.gain(amount) : delta < 0 ? s.loss(amount) : quiet;
  const luckLine = isLucky
    ? (isFair ? s.luck.goodFair : s.luck.goodRisky)
    : (isFair ? s.luck.badFair : s.luck.badRisky);
  const tone = isLucky ? 'good' : 'bad';
  return { tone, coin: tone, headline, message, grade, luckLine };
}
