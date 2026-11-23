import { useMemo } from 'react';
import { PERCENTILE_TABLES, buildReport, type Card, type DecisionRecord, type Locale } from '../../engine';
import { Oren } from '../art/Oren';
import { formatShort, rankBand } from '../i18n/format';
import { NetWorthChart, WellbeingChart } from '../report/charts';
import { useApp, useLocale, useStrings } from '../store';
import '../report/report.css';

function choiceLabel(record: DecisionRecord, content: readonly Card[], locale: Locale): string {
  const card = content.find((c) => c.id === record.cardId);
  return card?.choices?.find((c) => c.id === record.choiceId)?.copy[locale].label ?? record.choiceId;
}

type TileProps = { label: string; value: string; sub?: string; tone: string };

function StatTile({ label, value, sub, tone }: TileProps) {
  return (
    <div role="group" aria-label={label} className={`stat-tile ${tone}`}>
      <span className="stat-tile-head">{label}</span>
      <span className="stat-tile-value">{value}</span>
      {sub && <span className="stat-tile-sub">{sub}</span>}
    </div>
  );
}

/** You made it to 60: the archetype, the four tiles, both charts and the best and worst calls (spec 5.10). */
export function ReportScreen() {
  const game = useApp((st) => st.game);
  const content = useApp((st) => st.content);
  const quit = useApp((st) => st.quit);
  const locale = useLocale();
  const s = useStrings();
  const state = game?.run.state;
  const report = useMemo(() => (state ? buildReport(state, PERCENTILE_TABLES) : null), [state]);
  if (!state || !report) return null;

  const r = s.report;
  const best = report.best;
  const worst = report.worst && report.worst !== best ? report.worst : null;

  return (
    <section className="screen report">
      <h1 className="report-title">{r.done}</h1>
      <Oren expression="happy" size={64} />
      <p className="archetype-kicker">{r.yourLifeworth}</p>
      <h2 className="archetype">{r.archetype[report.archetype]}</h2>
      <div className="stat-tiles">
        <StatTile tone="tile-networth" label={r.tile.netWorth} value={formatShort(report.netWorth, locale)} sub={rankBand(report.netWorthPct)} />
        <StatTile tone="tile-wellbeing" label={r.tile.wellbeing} value={String(report.wellbeingFinal)} sub={s.feeling[report.wellbeingLevel]} />
        <StatTile tone="tile-decisions" label={r.tile.decisions} value={report.grade} sub={r.calls(state.decisions.length)} />
        <StatTile tone="tile-luck" label={r.tile.luck} value={rankBand(report.luckPct)} />
      </div>
      <p className="report-line">{r.relationships[report.relationships]}</p>
      <NetWorthChart series={report.series} startAge={state.start.startAge} />
      <WellbeingChart series={report.series} startAge={state.start.startAge} avg={report.avgWellbeing} />
      {best && <p className="report-line">{r.best(best.age, choiceLabel(best, content, locale))}</p>}
      {worst && <p className="report-line">{r.worst(worst.age, choiceLabel(worst, content, locale))}</p>}
      <div className="actions">
        <button type="button" className="btn" onClick={quit}>{r.again}</button>
      </div>
    </section>
  );
}
