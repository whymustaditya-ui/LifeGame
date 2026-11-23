import { m, useReducedMotion } from 'motion/react';
import { levelOf, type Report } from '../../engine';
import { formatRupiah, formatShort } from '../i18n/format';
import { useLocale, useStrings } from '../store';
import { areaPath, biggestDrop, linePath, strainedBands, toPoints } from './chart-math';
import './report.css';

const W = 260;
const H = 80;
const DRAW_SECONDS = 1;

type Series = Report['series'];

function DrawnLine({ d, stroke }: { d: string; stroke: string }) {
  const reduce = useReducedMotion();
  return (
    <m.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth="3.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      initial={reduce ? false : { pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: DRAW_SECONDS, ease: 'easeOut' }}
    />
  );
}

/** Net worth over age with a red dot on the biggest one-year drop (mockup v3). */
export function NetWorthChart({ series, startAge }: { series: Series; startAge: number }) {
  const locale = useLocale();
  const s = useStrings().report;
  const first = series[0];
  const last = series[series.length - 1];
  if (!first || !last) return null;

  const values = series.map((p) => p.netWorth);
  const points = toPoints(values, W, H);
  const drop = biggestDrop(values);
  const dropPoint = drop === null ? null : points[drop];
  const dropAge = drop === null ? null : series[drop]?.age;

  return (
    <figure className="chart">
      <figcaption>
        <small>{s.netWorthChart(startAge, last.age)}</small>
        <small className="chart-exact">{s.exactly(formatRupiah(last.netWorth, locale))}</small>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label={s.netWorthSummary(first.age, formatShort(first.netWorth, locale), last.age, formatShort(last.netWorth, locale))}>
        <path d={areaPath(points, H)} fill="var(--kunyit-bg)" />
        <DrawnLine d={linePath(points)} stroke="var(--kunyit-d)" />
        {dropPoint && <circle cx={dropPoint.x} cy={dropPoint.y} r="5" fill="var(--sambal)" stroke="var(--paper)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="chart-axis" aria-hidden="true">
        <span>{startAge}</span>
        <span className="chart-end">{last.age}</span>
      </div>
      {dropPoint && dropAge !== undefined && dropAge !== null && <small className="chart-drop">{s.drop(dropAge)}</small>}
    </figure>
  );
}

/** The revealed wellbeing line, 0 to 100, with Capek and Burnout years shaded. */
export function WellbeingChart({ series, startAge, avg }: { series: Series; startAge: number; avg: number }) {
  const s = useStrings().report;
  const last = series[series.length - 1];
  if (!last) return null;

  const points = toPoints(series.map((p) => p.wellbeing), W, H, { min: 0, max: 100 });
  const bands = strainedBands(series.map((p) => levelOf(p.wellbeing)));
  const step = series.length > 1 ? W / (series.length - 1) : W;

  return (
    <figure className="chart">
      <figcaption><small>{s.wellbeingChart(startAge, last.age)}</small></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={s.wellbeingSummary(avg, last.wellbeing)}>
        {bands.map((b) => (
          <rect key={b.start} x={Math.max(0, b.start * step - step / 2)} y="0" width={(b.end - b.start + 1) * step} height={H} fill="var(--sambal-bg)" />
        ))}
        <DrawnLine d={linePath(points)} stroke="var(--telang-d)" />
      </svg>
      <div className="chart-axis" aria-hidden="true">
        <span>{startAge}</span>
        <span className="chart-end">{last.age}</span>
      </div>
      {bands.length > 0 && <small className="chart-legend">{s.shaded}</small>}
    </figure>
  );
}
