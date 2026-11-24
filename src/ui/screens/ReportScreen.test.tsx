import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { Game } from '../../app/flow';
import { CONTENT } from '../../content';
import { PERCENTILE_TABLES, buildReport, pickFor, playToEnd, type Report } from '../../engine';
import { formatRupiah, rankBand } from '../i18n/format';
import { STRINGS } from '../i18n/strings';
import { NetWorthChart } from '../report/charts';
import { renderWithStore } from '../test/render';
import { ReportScreen } from './ReportScreen';

const finished = (): { game: Game; report: Report } => {
  const run = playToEnd('report-demo', CONTENT, pickFor('balanced'));
  return { game: { run, screen: { name: 'report' }, startWorth: 0 }, report: buildReport(run.state, PERCENTILE_TABLES) };
};

it('reveals the whole life', () => {
  const { game, report } = finished();
  renderWithStore(<ReportScreen />, { game });
  const s = STRINGS.en.report;
  expect(screen.getByRole('heading', { level: 1, name: s.done })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: s.archetype[report.archetype] })).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'Net worth' })).getByText(formatRupiah(report.netWorth, 'en'))).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'Wellbeing' })).getByText(String(report.wellbeingFinal))).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'Decisions' })).getByText(report.grade)).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: 'Luck' })).getByText(rankBand(report.luckPct))).toBeInTheDocument();
  expect(screen.getByText(s.relationships[report.relationships])).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /^Net worth went from/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /^Average wellbeing/ })).toBeInTheDocument();
  if (report.best) {
    const card = CONTENT.find((c) => c.id === report.best!.cardId)!;
    const label = card.choices!.find((c) => c.id === report.best!.choiceId)!.copy.en.label;
    expect(screen.getByText(s.best(report.best.age, label))).toBeInTheDocument();
  }
});
it('puts the drop label on its own line, clear of the axis ages', () => {
  const series = [
    { age: 18, netWorth: 10_000_000, wellbeing: 60 },
    { age: 19, netWorth: 2_000_000, wellbeing: 60 },
    { age: 20, netWorth: 50_000_000, wellbeing: 60 },
  ];
  renderWithStore(<NetWorthChart series={series} startAge={18} />);
  expect(screen.getByText('Biggest drop at 19').closest('.chart-axis')).toBeNull();
});
it('starts another life', async () => {
  const { store, user } = renderWithStore(<ReportScreen />, { game: finished().game });
  await user.click(screen.getByRole('button', { name: 'Live another life' }));
  expect(store.getState().game).toBeNull();
});
