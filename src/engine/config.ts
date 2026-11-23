import type {
  Education, FamilyMoney, LifeStage, MoneyPlan, People, Temperament, WellbeingLevel,
} from './types';

type ByLevel = Readonly<Record<WellbeingLevel, number>>;
type ByTemperament = Readonly<Record<Temperament, number>>;

export const END_AGE = 60;
export const START_AGE: Readonly<Record<Education, 18 | 21 | 22>> = { highschool: 18, diploma: 21, degree: 22 };
export const START_INCOME: Readonly<Record<Education, number>> = { highschool: 5_400_000, diploma: 6_500_000, degree: 8_000_000 };
export const START_CASH: Readonly<Record<FamilyMoney, number>> = { poor: 2_000_000, middle: 10_000_000, rich: 50_000_000 };
export const START_LIFESTYLE = 3_500_000;
export const PARENT_SUPPORT = 2_000_000;
export const CHILD_COST = 1_500_000;
export const THR_MONTHS = 13;

export const INDEX_RETURN = 0.05;
export const PROPERTY_GROWTH = 0.01;
export const KPR_RATE = 0.05;
export const PINJOL_RATE = 0.6;
export const CARD_RATE = 0.25;
export const PLAN_CASH_SHARE: Readonly<Record<MoneyPlan, number>> = { save_all: 1, half_index: 0.5, invest_most: 0.2 };

export const START_WELLBEING = 60;
export const START_SECURITY = 60;
export const START_PEOPLE: Readonly<People> = { family: 60, friend: 60, partner: null };
export const WELLBEING_ANCHOR = 55;
export const WELLBEING_PULL = 0.1;
export const WORK_STRESS = 2;
export const UNEMPLOYED_STRESS = 10;

export const RAISE_RATE: ByLevel = { seger: 0.04, oke: 0.03, capek: 0, burnout: 0 };
export const PROMOTION_BASE: Readonly<Record<LifeStage, number>> = { early: 0.18, building: 0.15, peak: 0.08, preretire: 0.03 };
export const PROMOTION_MULT: ByLevel = { seger: 1.3, oke: 1, capek: 0.6, burnout: 0.3 };
export const PROMOTION_RAISE = 0.15;
export const FIRING_CHANCE: ByLevel = { seger: 0, oke: 0, capek: 0, burnout: 0.25 };
export const REHIRE_BASE = 0.6;
export const REHIRE_PAY = 0.9;
export const PEOPLE_DRIFT: ByLevel = { seger: 3, oke: 0, capek: -4, burnout: -8 };

export const ODDS_BAD: ByLevel = { seger: 0.8, oke: 1, capek: 1.4, burnout: 1.8 };
export const ODDS_GOOD: ByLevel = { seger: 1.25, oke: 1, capek: 0.8, burnout: 0.6 };
export const STRESS_FACTOR: ByTemperament = { anxious: 1.5, impulsive: 1, steady: 0.8 };
export const FOMO_FACTOR: ByTemperament = { anxious: 1.2, impulsive: 1.3, steady: 0.8 };

export const CARD_CHANCE: readonly number[] = [0.55, 0.2];
export const MAX_CARDS_PER_YEAR = 2;
export const LUCK_CAREER = { promotion: 20, fired: -40, rehired: 10 } as const;

// Birth lottery (spec 5.2). Picks follow the listed key order as cumulative thresholds.
export const FAMILY_ODDS: Readonly<Record<FamilyMoney, number>> = { poor: 0.35, middle: 0.5, rich: 0.15 };
export const EDUCATION_ODDS: Readonly<Record<FamilyMoney, Readonly<Record<Education, number>>>> = {
  poor: { highschool: 0.6, diploma: 0.25, degree: 0.15 },
  middle: { highschool: 0.3, diploma: 0.3, degree: 0.4 },
  rich: { highschool: 0.1, diploma: 0.15, degree: 0.75 },
};
export const PARENTS_ODDS: Readonly<Record<FamilyMoney, number>> = { poor: 0.7, middle: 0.35, rich: 0.05 };
export const TEMPERAMENT_ODDS: Readonly<Record<Temperament, number>> = { anxious: 1 / 3, impulsive: 1 / 3, steady: 1 / 3 };
export const START_LUCK = {
  family: { poor: -30, middle: 0, rich: 30 },
  education: { highschool: -15, diploma: 0, degree: 10 },
  parents: -15,
  temperament: { anxious: -5, impulsive: -5, steady: 5 },
} as const;
