import type { CareerEvent } from '../../app/flow';
import type {
  ArchetypeKey, CardKind, DecisionScore, Education, FamilyMoney, Locale, MoneyPlan, Report, Temperament, WellbeingLevel,
} from '../../engine';

/** Every player-facing UI string. Card copy lives with the cards in src/content. Jaksel is a draft for owner review. */
export interface Strings {
  common: { continue: string; close: string };
  feeling: Record<WellbeingLevel, string>;
  welcome: { tagline: string; language: string; nickname: string; nicknameHint: string; start: string; disclaimer: string };
  lottery: {
    title: string; sub: string;
    family: string; familyValue: Record<FamilyMoney, string>;
    education: string; educationValue: Record<Education, string>;
    parents: string; parentsValue: { yes: string; no: string };
    temperament: string; temperamentValue: Record<Temperament, string>;
    firstJob: (age: number) => string; luck: (band: string) => string; go: string;
  };
  card: {
    title: Record<CardKind, (age: number) => string>;
    options: string; choose: string; seeWhat: string; warning: { capek: string; burnout: string };
  };
  topBar: { menu: string; age: (age: number) => string; feeling: (word: string) => string; wallet: (amount: string) => string };
  wallet: {
    title: string; netWorth: string; cash: string; emergency: string; months: (m: string) => string;
    index: string; property: string; kpr: string; pinjol: string; cardDebt: string;
    cover: string; insured: string; bpjsOnly: string;
    plan: string; planValue: Record<MoneyPlan | 'none', string>;
    income: string; noIncome: string; costs: string;
  };
  menu: { title: string; resume: string; restart: string; restartNote: string };
  outcome: {
    rollTitle: (age: number) => string; youChose: (label: string) => string;
    gain: (amount: string) => string; loss: (amount: string) => string; goodQuiet: string; badQuiet: string;
    yourCall: (word: string) => string; score: Record<DecisionScore, string>;
    situation: (months: string, hasPinjol: boolean, hasFamily: boolean) => string;
    luck: { badFair: string; badRisky: string; goodFair: string; goodRisky: string };
  };
  recap: {
    title: (age: number) => string; span: (from: number, to: number) => string; quiet: string;
    job: string; unemployed: string; income: string; perMonth: (amount: string) => string;
    netWorth: string; change: (delta: string, years: number) => string; feeling: string;
    event: Record<CareerEvent, string>; next: string; finish: string;
  };
  report: {
    done: string; yourLifeworth: string; archetype: Record<ArchetypeKey, string>;
    tile: { netWorth: string; wellbeing: string; decisions: string; luck: string };
    calls: (n: number) => string; relationships: Record<Report['relationships'], string>;
    best: (age: number, label: string) => string; worst: (age: number, label: string) => string;
    netWorthChart: (from: number, to: number) => string; exactly: (amount: string) => string; drop: (age: number) => string;
    wellbeingChart: (from: number, to: number) => string; shaded: string;
    netWorthSummary: (fromAge: number, start: string, toAge: number, end: string) => string;
    wellbeingSummary: (avg: number, final: number) => string; again: string;
  };
  error: { title: string; body: string; action: string };
}

const en: Strings = {
  common: { continue: 'Continue', close: 'Close' },
  feeling: { seger: 'Great', oke: 'Okay', capek: 'Tired', burnout: 'Burnt out' },
  welcome: {
    tagline: 'One whole life in ten minutes. Then see what was you and what was luck.',
    language: 'Language',
    nickname: 'Nickname (optional)',
    nicknameHint: 'Only shown on your share card.',
    start: 'Start my life',
    disclaimer: 'A game. Real life is messier, and none of this is financial advice.',
  },
  lottery: {
    title: 'Your starting line',
    sub: 'None of this was your choice.',
    family: 'Family money',
    familyValue: { poor: 'Tight', middle: 'Comfortable', rich: 'Well off' },
    education: 'Education',
    educationValue: { highschool: 'High school', diploma: 'Diploma', degree: 'Degree' },
    parents: 'Supporting parents',
    parentsValue: { yes: 'Yes, every month', no: 'No' },
    temperament: 'Temperament',
    temperamentValue: { anxious: 'Anxious', impulsive: 'Impulsive', steady: 'Steady' },
    firstJob: (age) => `First job at ${age}`,
    luck: (band) => `${band} of starts.`,
    go: 'Get to work',
  },
  card: {
    title: {
      dilemma: (age) => `Age ${age}. Your call.`,
      luck: (age) => `Age ${age}. Life happens.`,
      feed: (age) => `Age ${age}. Meanwhile, on your phone.`,
    },
    options: 'Your options',
    choose: 'Choose',
    seeWhat: 'See what happens',
    warning: { capek: 'Running on fumes lately.', burnout: 'Burnout. Something has to give.' },
  },
  topBar: {
    menu: 'Menu',
    age: (age) => `Age ${age}`,
    feeling: (word) => `How you feel: ${word}`,
    wallet: (amount) => `Net worth ${amount}. Open wallet`,
  },
  wallet: {
    title: 'Wallet',
    netWorth: 'Net worth',
    cash: 'Savings',
    emergency: 'Emergency fund',
    months: (m) => `${m} months of costs`,
    index: 'Index fund',
    property: 'Property',
    kpr: 'KPR (mortgage)',
    pinjol: 'Pinjol',
    cardDebt: 'Credit card',
    cover: 'Health cover',
    insured: 'BPJS and private',
    bpjsOnly: 'BPJS only',
    plan: 'Money plan',
    planValue: { save_all: 'Save it all', half_index: 'Half to an index fund', invest_most: 'Invest most of it', none: 'Not set yet' },
    income: 'Monthly income',
    noIncome: 'None right now',
    costs: 'Monthly costs',
  },
  menu: {
    title: 'Paused',
    resume: 'Keep playing',
    restart: 'Start a new life',
    restartNote: 'This run ends here and cannot be resumed.',
  },
  outcome: {
    rollTitle: (age) => `Age ${age}. How it landed.`,
    youChose: (label) => `You chose: ${label}`,
    gain: (amount) => `Gain, ${amount}`,
    loss: (amount) => `Loss, ${amount}`,
    goodQuiet: 'All good',
    badQuiet: 'Ouch',
    yourCall: (word) => `Your call: ${word}`,
    score: { 5: 'excellent', 4: 'sensible', 3: 'fair', 2: 'shaky', 1: 'poor' },
    situation: (months, hasPinjol, hasFamily) =>
      `At the time: ${months} months saved, ${hasPinjol ? 'pinjol still open' : 'no pinjol'}${hasFamily ? ', a family to cover' : ''}.`,
    luck: {
      badFair: 'Bad luck, not your fault.',
      badRisky: 'Bad luck this time.',
      goodFair: 'A lucky break.',
      goodRisky: 'Lucky this time.',
    },
  },
  recap: {
    title: (age) => `Age ${age}, done.`,
    span: (from, to) => `Ages ${from} to ${to}, done.`,
    quiet: 'Quiet years. Life went on.',
    job: 'Job',
    unemployed: 'Between jobs',
    income: 'Income',
    perMonth: (amount) => `${amount} a month`,
    netWorth: 'Net worth',
    change: (delta, years) => (years === 1 ? `${delta} this year` : `${delta} over ${years} years`),
    feeling: 'Feeling',
    event: { promoted: 'Promoted.', fired: 'You lost your job.', rehired: 'Back at work.' },
    next: 'Next year',
    finish: 'See my life',
  },
  report: {
    done: 'You made it to 60',
    yourLifeworth: 'Your Lifeworth',
    archetype: {
      burnt_out: 'Burnt out',
      rich_but_tired: 'Rich but tired',
      lucky_gambler: 'Lucky gambler',
      unlucky_but_wise: 'Unlucky but wise',
      steady_compounder: 'Steady compounder',
      broke_but_happy: 'Broke but happy',
      sandwich_hero: 'Sandwich hero',
      balanced: 'Balanced',
      getting_by: 'Getting by',
    },
    tile: { netWorth: 'Net worth', wellbeing: 'Wellbeing', decisions: 'Decisions', luck: 'Luck' },
    calls: (n) => `${n} calls graded`,
    relationships: {
      strong: 'Your people stayed close.',
      okay: 'Your people are still around.',
      strained: 'Your people drifted away.',
    },
    best: (age, label) => `Best call, at ${age}: ${label}`,
    worst: (age, label) => `Worst call, at ${age}: ${label}`,
    netWorthChart: (from, to) => `Net worth, age ${from} to ${to}`,
    exactly: (amount) => `Exactly ${amount}`,
    drop: (age) => `Biggest drop at ${age}`,
    wellbeingChart: (from, to) => `Wellbeing, age ${from} to ${to}`,
    shaded: 'Shaded: tired or burnt out',
    netWorthSummary: (fromAge, start, toAge, end) => `Net worth went from ${start} at ${fromAge} to ${end} at ${toAge}.`,
    wellbeingSummary: (avg, final) => `Average wellbeing ${avg}, ending at ${final}.`,
    again: 'Live another life',
  },
  error: {
    title: 'Something broke.',
    body: 'Not your fault. This life cannot continue.',
    action: 'Start a new life',
  },
};

const jaksel: Strings = {
  common: { continue: 'Lanjut', close: 'Tutup' },
  feeling: { seger: 'Seger', oke: 'Oke', capek: 'Capek', burnout: 'Burnout' },
  welcome: {
    tagline: 'Satu hidup, sepuluh menit. Abis itu keliatan, mana yang keputusan lo, mana yang cuma hoki.',
    language: 'Bahasa',
    nickname: 'Nickname (opsional)',
    nicknameHint: 'Cuma muncul di share card lo.',
    start: 'Mulai hidup',
    disclaimer: 'Ini cuma game. Hidup aslinya lebih ribet, dan ini bukan saran keuangan.',
  },
  lottery: {
    title: 'Garis start lo',
    sub: 'Gak ada yang lo pilih di sini.',
    family: 'Duit keluarga',
    familyValue: { poor: 'Pas-pasan', middle: 'Cukupan', rich: 'Tajir' },
    education: 'Pendidikan',
    educationValue: { highschool: 'SMA', diploma: 'D3', degree: 'S1' },
    parents: 'Nanggung ortu',
    parentsValue: { yes: 'Iya, tiap bulan', no: 'Nggak' },
    temperament: 'Bawaan',
    temperamentValue: { anxious: 'Overthinker', impulsive: 'Impulsif', steady: 'Kalem' },
    firstJob: (age) => `Kerja pertama umur ${age}`,
    luck: (band) => `${band} dari semua start.`,
    go: 'Mulai kerja',
  },
  card: {
    title: {
      dilemma: (age) => `Umur ${age}. Pilih langkah lo.`,
      luck: (age) => `Umur ${age}. Namanya juga hidup.`,
      feed: (age) => `Umur ${age}. Sementara itu, di HP lo.`,
    },
    options: 'Pilihan lo',
    choose: 'Pilih',
    seeWhat: 'Lihat hasilnya',
    warning: { capek: 'Energi lo tinggal dikit.', burnout: 'Udah burnout. Ada yang harus dilepas.' },
  },
  topBar: {
    menu: 'Menu',
    age: (age) => `Umur ${age}`,
    feeling: (word) => `Kondisi lo: ${word}`,
    wallet: (amount) => `Kekayaan bersih ${amount}. Buka dompet`,
  },
  wallet: {
    title: 'Dompet',
    netWorth: 'Kekayaan bersih',
    cash: 'Tabungan',
    emergency: 'Dana darurat',
    months: (m) => `${m} bulan biaya hidup`,
    index: 'Reksa dana indeks',
    property: 'Properti',
    kpr: 'KPR',
    pinjol: 'Pinjol',
    cardDebt: 'Kartu kredit',
    cover: 'Asuransi kesehatan',
    insured: 'BPJS plus swasta',
    bpjsOnly: 'BPJS aja',
    plan: 'Rencana duit',
    planValue: { save_all: 'Tabung semua', half_index: 'Setengah ke reksa dana', invest_most: 'Investasi hampir semua', none: 'Belum ada' },
    income: 'Gaji sebulan',
    noIncome: 'Lagi gak ada',
    costs: 'Biaya hidup sebulan',
  },
  menu: {
    title: 'Pause dulu',
    resume: 'Lanjut main',
    restart: 'Mulai hidup baru',
    restartNote: 'Run yang ini selesai di sini, gak bisa dilanjut.',
  },
  outcome: {
    rollTitle: (age) => `Umur ${age}. Hasilnya keluar.`,
    youChose: (label) => `Pilihan lo: ${label}`,
    gain: (amount) => `Untung, ${amount}`,
    loss: (amount) => `Rugi, ${amount}`,
    goodQuiet: 'Aman',
    badQuiet: 'Apes',
    yourCall: (word) => `Keputusan lo: ${word}`,
    score: { 5: 'mantap', 4: 'masuk akal', 3: 'lumayan', 2: 'agak nekat', 1: 'kurang oke' },
    situation: (months, hasPinjol, hasFamily) =>
      `Waktu itu: dana darurat ${months} bulan, ${hasPinjol ? 'masih ada pinjol' : 'bebas pinjol'}${hasFamily ? ', ada keluarga yang ditanggung' : ''}.`,
    luck: {
      badFair: 'Yang ini apes, bukan salah lo.',
      badRisky: 'Kali ini apes.',
      goodFair: 'Hoki dikit.',
      goodRisky: 'Kali ini hoki.',
    },
  },
  recap: {
    title: (age) => `Umur ${age} kelar.`,
    span: (from, to) => `Umur ${from} sampai ${to} kelar.`,
    quiet: 'Tahun-tahun yang tenang. Hidup jalan terus.',
    job: 'Kerjaan',
    unemployed: 'Lagi nganggur',
    income: 'Gaji',
    perMonth: (amount) => `${amount} sebulan`,
    netWorth: 'Kekayaan bersih',
    change: (delta, years) => (years === 1 ? `${delta} tahun ini` : `${delta} dalam ${years} tahun`),
    feeling: 'Kondisi',
    event: { promoted: 'Naik jabatan.', fired: 'Lo kena PHK.', rehired: 'Udah kerja lagi.' },
    next: 'Tahun depan',
    finish: 'Liat hasil hidup gue',
  },
  report: {
    done: 'Lo berhasil sampai umur 60',
    yourLifeworth: 'Lifeworth lo',
    archetype: {
      burnt_out: 'Burnout akut',
      rich_but_tired: 'Tajir tapi capek',
      lucky_gambler: 'Gambler hoki',
      unlucky_but_wise: 'Apes tapi bijak',
      steady_compounder: 'Compounder kalem',
      broke_but_happy: 'Bokek tapi bahagia',
      sandwich_hero: 'Pahlawan sandwich',
      balanced: 'Hidup seimbang',
      getting_by: 'Yang penting jalan',
    },
    tile: { netWorth: 'Kekayaan', wellbeing: 'Wellbeing', decisions: 'Keputusan', luck: 'Hoki' },
    calls: (n) => `${n} keputusan dinilai`,
    relationships: {
      strong: 'Orang-orang terdekat lo tetep deket.',
      okay: 'Circle lo masih ada, walau gak sedeket dulu.',
      strained: 'Circle lo pelan-pelan menjauh.',
    },
    best: (age, label) => `Keputusan terbaik, umur ${age}: ${label}`,
    worst: (age, label) => `Keputusan terburuk, umur ${age}: ${label}`,
    netWorthChart: (from, to) => `Kekayaan bersih, umur ${from} sampai ${to}`,
    exactly: (amount) => `Tepatnya ${amount}`,
    drop: (age) => `Paling anjlok di umur ${age}`,
    wellbeingChart: (from, to) => `Wellbeing, umur ${from} sampai ${to}`,
    shaded: 'Arsir: capek atau burnout',
    netWorthSummary: (fromAge, start, toAge, end) => `Kekayaan bersih dari ${start} di umur ${fromAge} jadi ${end} di umur ${toAge}.`,
    wellbeingSummary: (avg, final) => `Rata-rata wellbeing ${avg}, akhirnya ${final}.`,
    again: 'Main lagi',
  },
  error: {
    title: 'Ada yang rusak.',
    body: 'Bukan salah lo. Hidup yang ini gak bisa lanjut.',
    action: 'Mulai hidup baru',
  },
};

export const STRINGS: Readonly<Record<Locale, Strings>> = { en, jaksel };
