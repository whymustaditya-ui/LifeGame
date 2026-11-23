import { applyWellbeingDelta } from './wellbeing';
import type { Career, Effect, GameState, People } from './types';

const clamp = (x: number): number => Math.min(100, Math.max(0, x));

function withFlags(flags: GameState['flags'], add: readonly (string | undefined | false)[]): GameState['flags'] {
  const names = add.filter((f): f is string => typeof f === 'string');
  return names.length === 0 ? flags : { ...flags, ...Object.fromEntries(names.map((f) => [f, true as const])) };
}

function nextPeople(p: People, e: Effect, marrying: boolean): People {
  const partnerBase = p.partner ?? (marrying ? 60 : null);
  return {
    family: clamp(p.family + (e.family ?? 0)),
    friend: clamp(p.friend + (e.friend ?? 0)),
    partner: partnerBase === null ? null : clamp(partnerBase + (e.partner ?? 0)),
  };
}

function nextCareer(c: Career, e: Effect): Career {
  const security = clamp(c.security + (e.security ?? 0));
  const scaled = e.monthlyIncomeFactor === undefined ? c.monthlyIncome : Math.round(c.monthlyIncome * e.monthlyIncomeFactor);
  if (e.setEmployed === false && c.employed) return { ...c, security, employed: false, lastIncome: scaled, monthlyIncome: 0 };
  if (e.setEmployed === true && !c.employed) return { ...c, security, employed: true, monthlyIncome: c.lastIncome };
  return { ...c, security, monthlyIncome: scaled };
}

/** Applies an effect immutably. Cash never goes below 0: the remainder becomes pinjol. */
export function applyEffect(s: GameState, e: Effect): GameState {
  const f = s.fin;
  const kpr = e.startKpr;
  const cashAfter = f.cash + (e.cash ?? 0) - (kpr?.downPayment ?? 0);
  const overdraft = Math.max(0, -cashAfter);
  const marrying = e.setMarried === true && !s.married;
  const losingJob = e.setEmployed === false && s.career.employed;
  return {
    ...s,
    fin: {
      ...f,
      cash: Math.max(0, cashAfter),
      index: f.index + (e.index ?? 0),
      pinjol: f.pinjol + (e.pinjol ?? 0) + overdraft,
      cardDebt: f.cardDebt + (e.cardDebt ?? 0),
      property: f.property + (kpr?.price ?? 0),
      kpr: f.kpr + (kpr ? kpr.price - kpr.downPayment : 0),
      kprMonthly: kpr ? kpr.monthly : f.kprMonthly,
      insured: e.setInsured ?? f.insured,
    },
    career: nextCareer(s.career, e),
    wellbeing: e.wellbeing === undefined ? s.wellbeing : applyWellbeingDelta(s.wellbeing, e.wellbeing, s.start.temperament),
    people: nextPeople(s.people, e, marrying),
    monthlyLifestyle: s.monthlyLifestyle + (e.monthlyLifestyle ?? 0),
    plan: e.setPlan ?? s.plan,
    married: s.married || e.setMarried === true,
    children: s.children + (e.addChild ? 1 : 0),
    flags: withFlags(s.flags, [
      marrying && 'just_married', e.addChild && 'just_child', losingJob && 'career_changed', kpr && 'just_kpr', e.setFlag,
    ]),
  };
}
