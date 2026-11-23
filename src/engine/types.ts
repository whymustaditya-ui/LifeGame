export type { Stream } from './rng';

export type Locale = 'en' | 'jaksel';
export type Localized<T> = Readonly<Record<Locale, T>>;
export type FamilyMoney = 'poor' | 'middle' | 'rich';
export type Education = 'highschool' | 'diploma' | 'degree';
export type Temperament = 'anxious' | 'impulsive' | 'steady';
export type WellbeingLevel = 'seger' | 'oke' | 'capek' | 'burnout';
export type LifeStage = 'early' | 'building' | 'peak' | 'preretire';
export type MoneyPlan = 'save_all' | 'half_index' | 'invest_most';
export type DecisionScore = 1 | 2 | 3 | 4 | 5;
export type LetterGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'E';
export type Trigger = 'first_salary' | 'career_change' | 'married' | 'child' | 'kpr'
  | 'capek' | 'pinjol' | 'first_job_insurance' | 'family_insurance';
export type CardKind = 'dilemma' | 'luck' | 'feed';

export interface StartProfile {
  family: FamilyMoney; education: Education; supportsParents: boolean;
  temperament: Temperament; startAge: 18 | 21 | 22; luckPoints: number;
}
export interface Finances {
  cash: number; index: number; property: number; kpr: number; kprMonthly: number;
  pinjol: number; cardDebt: number; insured: boolean;
}
export interface Career {
  employed: boolean; level: number; monthlyIncome: number; lastIncome: number;
  titleKey: string; security: number;
}
export interface People { family: number; friend: number; partner: number | null }
export interface YearRecord { age: number; netWorth: number; wellbeing: number; level: WellbeingLevel; events: string[] }
export interface DecisionRecord { age: number; cardId: string; choiceId: string; score: DecisionScore }
export interface LuckEntry { age: number; source: string; expected: number; actual: number }

export interface GameState {
  seed: string; age: number; start: StartProfile; fin: Finances; career: Career;
  monthlyLifestyle: number; plan: MoneyPlan | null; wellbeing: number; people: People;
  married: boolean; children: number; capekYears: number; burnoutYears: number;
  flags: Readonly<Record<string, true>>; seen: readonly string[];
  history: readonly YearRecord[]; decisions: readonly DecisionRecord[]; luck: readonly LuckEntry[];
}

export interface VisibleState {
  age: number; stage: LifeStage; cash: number; emergencyMonths: number; index: number; property: number;
  debt: { kpr: number; pinjol: number; cardDebt: number }; insured: boolean; netWorth: number;
  employed: boolean; monthlyIncome: number; titleKey: string; monthlyCosts: number;
  wellbeingLevel: WellbeingLevel; married: boolean; children: number; supportsParents: boolean; plan: MoneyPlan | null;
}

export interface Effect {
  cash?: number; index?: number; pinjol?: number; cardDebt?: number;
  wellbeing?: number; family?: number; friend?: number; partner?: number; security?: number;
  monthlyLifestyle?: number; monthlyIncomeFactor?: number;
  setPlan?: MoneyPlan; setInsured?: boolean; setEmployed?: boolean; setMarried?: boolean;
  addChild?: boolean; setFlag?: string;
  startKpr?: { price: number; downPayment: number; monthly: number };
}

export interface Outcome { effect: (s: GameState) => Effect; luck: number; copy: Localized<string> }
export interface Roll { p: (s: GameState) => number; hit: Outcome; miss: Outcome }

export interface Choice {
  id: string; copy: Localized<{ label: string; note?: string }>;
  effect: (s: GameState) => Effect; grade?: (v: VisibleState) => DecisionScore;
  roll?: Roll; result?: Localized<string>;
}

export interface Card {
  id: string; kind: CardKind; stages: readonly LifeStage[]; repeatable: boolean; weight: number;
  triggers?: readonly Trigger[]; eligible?: (s: GameState) => boolean;
  copy: Localized<string>; choices?: readonly Choice[]; roll?: Roll;
}
