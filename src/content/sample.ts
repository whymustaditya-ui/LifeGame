import { toVisible } from '../engine/visible';
import { fomoFactor, levelOf, oddsMultiplier } from '../engine/wellbeing';
import type { Card, Choice, DecisionScore, LifeStage, Localized, VisibleState } from '../engine/types';

/** Sample content for engine tests and the CLI. Plan 3 replaces it with the full, owner-reviewed set. */

const ALL: readonly LifeStage[] = ['early', 'building', 'peak', 'preretire'];
const t = (en: string, jaksel: string): Localized<string> => ({ en, jaksel });
const label = (en: string, jaksel: string, note?: readonly [string, string]): Choice['copy'] => (note
  ? { en: { label: en, note: note[0] }, jaksel: { label: jaksel, note: note[1] } }
  : { en: { label: en }, jaksel: { label: jaksel } });

type Scores = readonly [DecisionScore, DecisionScore, DecisionScore, DecisionScore];

/** Money plan scores by situation: pinjol, under 3 months saved, under 45, 45 and over. */
const planGrade = (s: Scores) => (v: VisibleState): DecisionScore => {
  if (v.debt.pinjol > 0) return s[0];
  if (v.emergencyMonths < 3) return s[1];
  return v.age < 45 ? s[2] : s[3];
};

/** Trip scores by situation: pinjol, 6+ months saved, 3 to 6 months, under 3 months. */
const tripGrade = (s: Scores) => (v: VisibleState): DecisionScore => {
  if (v.debt.pinjol > 0) return s[0];
  if (v.emergencyMonths >= 6) return s[1];
  return v.emergencyMonths >= 3 ? s[2] : s[3];
};

const familyAtStake = (v: VisibleState): boolean => v.married || v.children > 0;
const kopiIsSmallBet = (v: VisibleState): boolean =>
  v.emergencyMonths >= 6 && 10_000_000 / Math.max(v.netWorth, 1) <= 0.1;

export const SAMPLE_CARDS: readonly Card[] = [
  {
    id: 'money_plan', kind: 'dilemma', stages: ALL, repeatable: true, weight: 1,
    triggers: ['first_salary', 'career_change', 'married', 'child', 'kpr'],
    copy: t('Payday came in. Where does whatever is left each month go?', 'Gajian udah masuk. Sisa duit tiap bulan mau lo kemanain?'),
    choices: [
      { id: 'save_all', copy: label('Keep it all in savings', 'Tabung semua aja'), effect: () => ({ setPlan: 'save_all' }),
        grade: planGrade([4, 5, 2, 3]), result: t('Everything goes to savings. Boring, safe.', 'Semua masuk tabungan. Boring, tapi aman.') },
      { id: 'half_index', copy: label('Half to savings, half to an index fund', 'Setengah nabung, setengah reksa dana indeks'), effect: () => ({ setPlan: 'half_index' }),
        grade: planGrade([2, 3, 4, 5]), result: t('Half saved, half invested.', 'Setengah aman, setengah jalan.') },
      { id: 'invest_most', copy: label('Invest most of it', 'Investasi hampir semuanya'), effect: () => ({ setPlan: 'invest_most' }),
        grade: planGrade([1, 1, 5, 4]), result: t('Most of it goes to the market. The market does not care about your feelings.', 'Mayoritas masuk market. Market gak peduli perasaan lo.') },
    ],
  },
  {
    id: 'recovery', kind: 'dilemma', stages: ALL, repeatable: true, weight: 1, triggers: ['capek'],
    copy: t('Three weeks of five-hour nights. Today you snapped at someone over nothing.', 'Udah 3 minggu tidur 5 jam. Tadi lo ngegas ke orang cuma gara-gara hal kecil.'),
    choices: [
      { id: 'leave', copy: label('Take a month of unpaid leave', 'Ambil cuti sebulan, unpaid'), effect: (s) => ({ cash: -s.career.monthlyIncome, wellbeing: 25 }),
        grade: (v) => (v.emergencyMonths >= 1 ? 5 : 3), result: t('A month off. You remember what weekends feel like.', 'Sebulan off. Lo inget lagi rasanya weekend.') },
      { id: 'therapy', copy: label('See a therapist', 'Ke psikolog', ['Rp6 million', 'Rp6 jt']), effect: () => ({ cash: -6_000_000, wellbeing: 15 }),
        grade: () => 4, result: t('Twelve sessions in, the knot in your chest loosens.', 'Dua belas sesi, dada lo mulai lega.') },
      { id: 'push_through', copy: label('Push through, it is just a phase', 'Gas terus, cuma fase doang'), effect: () => ({ wellbeing: -5, security: 5 }),
        grade: () => 1, result: t('Your boss notices the overtime. So does your body.', 'Bos lo notice lemburannya. Badan lo juga notice.') },
    ],
  },
  {
    id: 'pinjol_payoff', kind: 'dilemma', stages: ALL, repeatable: true, weight: 1, triggers: ['pinjol'],
    copy: t('The pinjol app reminds you, again, that interest grows every day.', 'Aplikasi pinjol ngingetin lagi, bunganya jalan terus tiap hari.'),
    choices: [
      { id: 'pay_all', copy: label('Pay off as much as you can', 'Lunasin semampunya'),
        effect: (s) => { const pay = Math.min(s.fin.cash, s.fin.pinjol); return { cash: -pay, pinjol: -pay }; },
        grade: () => 5, result: t('Paid down. The notifications finally go quiet.', 'Udah dibayar. Notifnya akhirnya diem.') },
      { id: 'pay_half', copy: label('Pay half of what you can', 'Bayar setengahnya dulu'),
        effect: (s) => { const pay = Math.round(Math.min(s.fin.cash, s.fin.pinjol) / 2); return { cash: -pay, pinjol: -pay }; },
        grade: () => 3, result: t('Half paid. The other half keeps growing.', 'Setengah lunas. Setengahnya lagi masih beranak.') },
      { id: 'later', copy: label('Deal with it later', 'Nanti aja deh'), effect: () => ({}),
        grade: (v) => (v.cash >= v.debt.pinjol ? 1 : 2), result: t('Later arrives with 60% interest.', 'Nanti dateng bareng bunga 60%.') },
    ],
  },
  {
    id: 'insurance_offer', kind: 'dilemma', stages: ALL, repeatable: true, weight: 1,
    triggers: ['first_job_insurance', 'family_insurance'], eligible: (s) => !s.fin.insured,
    copy: t('An agent at the office offers private health cover on top of BPJS. Rp400 thousand a month.', 'Agen asuransi di kantor nawarin asuransi kesehatan tambahan selain BPJS. Rp400 ribu sebulan.'),
    choices: [
      { id: 'buy', copy: label('Sign up', 'Ambil'), effect: () => ({ setInsured: true, monthlyLifestyle: 400_000 }),
        grade: (v) => (familyAtStake(v) ? 5 : 4), result: t('Covered. You hope you never need it.', 'Udah ke-cover. Semoga gak kepake.') },
      { id: 'skip', copy: label('Skip it, BPJS is enough', 'Skip, BPJS cukup'), effect: () => ({}),
        grade: (v) => (familyAtStake(v) ? 1 : 3), result: t('BPJS it is.', 'BPJS aja dulu.') },
    ],
  },
  {
    id: 'japan_trip', kind: 'dilemma', stages: ['early', 'building'], repeatable: false, weight: 3,
    copy: t('Your group chat is booking Japan for April. Rp18 million each.', 'Grup chat udah mau booking Jepang buat April. Rp18 jt per orang. Lo ikut gak?'),
    choices: [
      { id: 'book', copy: label("Book it. I've earned this.", 'Gas, healing itu penting'), effect: () => ({ cash: -18_000_000, wellbeing: 15, friend: 8 }),
        grade: tripGrade([1, 4, 2, 1]), result: t('Kyoto in spring. Your camera roll is mostly temples now.', 'Kyoto pas spring. Galeri lo isinya kuil semua.') },
      { id: 'bali', copy: label('Go to Bali instead', 'Bali aja deh', ['Rp6 million', 'Rp6 jt']), effect: () => ({ cash: -6_000_000, wellbeing: 8, friend: 3 }),
        grade: tripGrade([2, 5, 5, 2]), result: t('Bali with the same group chat. Cheaper, still fun.', 'Bali bareng grup yang sama. Lebih murah, tetep seru.') },
      { id: 'skip', copy: label('Skip it and keep saving', 'Skip dulu, mau nabung'), effect: () => ({ wellbeing: -6, friend: -3 }),
        grade: tripGrade([5, 3, 4, 5]), result: t('You stay home. The group chat is very loud for a week.', 'Lo di rumah aja. Grup chat rame banget seminggu.') },
    ],
  },
  {
    id: 'kopi_bet', kind: 'dilemma', stages: ['early', 'building'], repeatable: false, weight: 2,
    copy: t('Your friend is opening a kopi susu shop and needs Rp10 million from investors. Are you in?', 'Temen lo mau buka kedai kopi susu, lagi nyari modal Rp10 jt. Lo masuk?'),
    choices: [
      { id: 'invest', copy: label('Put in Rp10 million', 'Masuk, Rp10 jt'), effect: () => ({ cash: -10_000_000 }),
        grade: (v) => (kopiIsSmallBet(v) ? 4 : v.emergencyMonths < 3 || v.debt.pinjol > 0 ? 1 : 3),
        roll: {
          p: () => 0.35,
          hit: { effect: () => ({ cash: 25_000_000, wellbeing: 5 }), luck: 20,
            copy: t('The shop is packed every weekend. You get Rp25 million back.', 'Kedainya rame tiap weekend. Lo dapet balik Rp25 jt.') },
          miss: { effect: () => ({ wellbeing: -4 }), luck: -10,
            copy: t('The shop closed after 8 months.', 'Kedainya tutup setelah 8 bulan.') },
        } },
      { id: 'pass', copy: label('Wish them luck, keep my money', 'Support dari jauh aja'), effect: () => ({}),
        grade: (v) => (kopiIsSmallBet(v) ? 4 : 5), result: t('You buy a coffee on opening day instead.', 'Lo beli kopi aja pas opening.') },
    ],
  },
  {
    id: 'health_check', kind: 'luck', stages: ALL, repeatable: true, weight: 2,
    copy: t('Annual check-up at the clinic.', 'Medical check-up tahunan di klinik.'),
    roll: {
      p: (s) => 0.15 * oddsMultiplier(levelOf(s.wellbeing), 'bad'),
      hit: {
        effect: (s) => ({ cash: s.fin.insured ? -2_500_000 : s.people.family >= 60 ? -15_000_000 : -25_000_000, wellbeing: -8 }),
        luck: -25,
        copy: t('The doctor finds something. A week in hospital, and a bill to match.', 'Dokternya nemu sesuatu. Seminggu opname, tagihannya juga lumayan.'),
      },
      miss: { effect: () => ({ wellbeing: 2 }), luck: 5,
        copy: t('All clear. The doctor says drink more water.', 'Aman semua. Dokternya cuma bilang banyakin minum air putih.') },
    },
  },
  {
    id: 'friend_car', kind: 'feed', stages: ['early', 'building', 'peak'], repeatable: true, weight: 3,
    copy: t('Raka posts his new car. The caption says "small reward for myself".', 'Raka upload mobil barunya. Captionnya "self reward kecil-kecilan".'),
    choices: [
      { id: 'scroll', copy: label('Keep scrolling', 'Scroll lagi'),
        effect: (s) => (toVisible(s).emergencyMonths >= 6 ? { wellbeing: -1 } : { wellbeing: -Math.round(4 * fomoFactor(s.start.temperament)) }),
        result: t('You close the app. Ten minutes later you open it again.', 'Lo tutup aplikasinya. Sepuluh menit kemudian buka lagi.') },
    ],
  },
  {
    id: 'restructuring', kind: 'luck', stages: ['building', 'peak'], repeatable: true, weight: 1, eligible: (s) => s.career.employed,
    copy: t('HR books a company-wide meeting called "Organizational alignment".', 'HR bikin meeting satu kantor, judulnya "Organizational alignment".'),
    roll: {
      p: (s) => Math.min(0.9, 0.3 * oddsMultiplier(levelOf(s.wellbeing), 'bad') * (s.career.security < 50 ? 1.5 : 1)),
      hit: { effect: () => ({ setEmployed: false, wellbeing: -10 }), luck: -40,
        copy: t('Your role was aligned out of existence. Your desk fits in one box.', 'Posisi lo kena "alignment". Meja lo muat satu kardus.') },
      miss: { effect: () => ({ security: 5 }), luck: 8,
        copy: t('Your team survives. More work, same pay.', 'Tim lo selamat. Kerjaan nambah, gaji sama.') },
    },
  },
];
