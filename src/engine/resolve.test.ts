import { describe, it, expect } from 'vitest';
import { applyEffect } from './effects';
import { resolveChoice } from './resolve';
import { draw, keyOf } from './rng';
import { deepFreeze, findSeed, makeState } from './test-utils';
import type { Card, Choice, Outcome, Roll } from './types';

const ALL = ['early', 'building', 'peak', 'preretire'] as const;
const L = (t: string) => ({ en: t, jaksel: t });
const label = (t: string) => ({ en: { label: t }, jaksel: { label: t } });
const outcome = (luck: number): Outcome => ({ effect: () => ({}), luck, copy: L(`luck ${luck}`) });
const dilemma = (o: { id?: string; grade?: Choice['grade']; effect?: Choice['effect']; roll?: Roll }): Card => ({
  id: o.id ?? 'd1', kind: 'dilemma', stages: ALL, repeatable: true, weight: 1, copy: L('question'),
  choices: [
    { id: 'a', copy: label('A'), effect: o.effect ?? (() => ({})), ...(o.grade ? { grade: o.grade } : {}), ...(o.roll ? { roll: o.roll } : {}), result: L('a done') },
    { id: 'b', copy: label('B'), effect: () => ({}), grade: () => 3, result: L('b done') },
  ],
});
const luckCard = (o: { id: string }): Card => ({
  id: o.id, kind: 'luck', stages: ALL, repeatable: true, weight: 1, copy: L('event'),
  roll: { p: () => 0.5, hit: outcome(-10), miss: outcome(5) },
});

describe('resolveChoice and applyEffect', () => {
  it('grades on the snapshot from before the effect', () => {
    const card = dilemma({ grade: (v) => (v.cash >= 10_000_000 ? 5 : 1), effect: () => ({ cash: -8_000_000 }) });
    const r = resolveChoice(deepFreeze(makeState({ fin: { ...makeState().fin, cash: 10_000_000 } })), card, 'a');
    expect(r.result.score).toBe(5);
    expect(r.state.decisions.at(-1)).toMatchObject({ cardId: card.id, choiceId: 'a', score: 5 });
  });
  it('records expected and actual luck for an outcome roll', () => {
    const seed = findSeed((x) => draw(x, keyOf(22, 'outcome', 'bet')) >= 0.35);
    const card = dilemma({ id: 'bet', roll: { p: () => 0.35, hit: outcome(20), miss: outcome(-10) } });
    const r = resolveChoice(makeState({ seed }), card, 'a');
    expect(r.result.roll).toMatchObject({ hit: false, luck: -10 });
    expect(r.state.luck.at(-1)?.expected).toBeCloseTo(0.5);
  });
  it('rolls luck cards on the luck stream with choice ok', () => {
    const r = resolveChoice(makeState(), luckCard({ id: 'health' }), 'ok');
    expect(r.result.score).toBeNull();
    expect(() => resolveChoice(makeState(), luckCard({ id: 'health' }), 'a')).toThrow();
  });
  it('throws on an unknown choice', () => {
    expect(() => resolveChoice(makeState(), dilemma({}), 'zzz')).toThrow('Unknown choice zzz');
  });
  it('turns overspending into pinjol', () => {
    const s = applyEffect(makeState({ fin: { ...makeState().fin, cash: 3_000_000 } }), { cash: -5_000_000 });
    expect(s.fin.cash).toBe(0);
    expect(s.fin.pinjol).toBe(2_000_000);
  });
  it('starts a KPR', () => {
    const s = applyEffect(makeState({ fin: { ...makeState().fin, cash: 100_000_000 } }), { startKpr: { price: 500_000_000, downPayment: 50_000_000, monthly: 4_000_000 } });
    expect(s.fin).toMatchObject({ property: 500_000_000, cash: 50_000_000, kpr: 450_000_000, kprMonthly: 4_000_000 });
    expect(s.flags.just_kpr).toBe(true);
  });
});

describe('applyEffect fixes from the final review', () => {
  it('sells index funds before borrowing on overspending', () => {
    const s = applyEffect(makeState({ fin: { ...makeState().fin, cash: 3_000_000, index: 10_000_000 } }), { cash: -5_000_000 });
    expect(s.fin).toMatchObject({ cash: 0, index: 8_000_000, pinjol: 0 });
  });
  it('tracks pinjol principal as it is borrowed and repaid', () => {
    const borrowed = applyEffect(makeState({ fin: { ...makeState().fin, cash: 0 } }), { cash: -10_000_000 });
    expect(borrowed.fin).toMatchObject({ pinjol: 10_000_000, pinjolPrincipal: 10_000_000 });
    const grown = { ...borrowed, fin: { ...borrowed.fin, pinjol: 16_000_000 } };
    expect(applyEffect(grown, { pinjol: -8_000_000 }).fin).toMatchObject({ pinjol: 8_000_000, pinjolPrincipal: 5_000_000 });
  });
  it('offers family insurance at marriage and the first child only', () => {
    expect(applyEffect(makeState(), { setMarried: true }).flags.family_insurance_due).toBe(true);
    expect(applyEffect(makeState(), { addChild: true }).flags.family_insurance_due).toBe(true);
    expect(applyEffect(makeState({ children: 1 }), { addChild: true }).flags.family_insurance_due).toBeUndefined();
  });
});
