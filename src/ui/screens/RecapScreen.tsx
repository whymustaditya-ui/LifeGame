import { jobTitle } from '../../content/titles';
import { Oren, orenFor } from '../art/Oren';
import { TopBar } from '../components/TopBar';
import { formatDelta, formatRupiah } from '../i18n/format';
import { useApp, useLocale, useStrings } from '../store';
import './screens.css';

/** The year (or run of quiet years) just closed: job, income, net worth and how it felt (spec 5.1, 5.3). */
export function RecapScreen() {
  const game = useApp((st) => st.game);
  const leaveRecap = useApp((st) => st.leaveRecap);
  const locale = useLocale();
  const s = useStrings();
  if (!game || game.screen.name !== 'recap') return null;

  const r = game.screen.recap;
  const years = r.toAge - r.fromAge + 1;
  const title = years === 1 ? s.recap.title(r.toAge) : s.recap.span(r.fromAge, r.toAge);

  return (
    <section className="screen">
      <TopBar />
      <h1 className="screen-title">{title}</h1>
      {years > 1 && <p className="screen-sub">{s.recap.quiet}</p>}
      {r.event && <p className={r.event === 'fired' ? 'banner banner-bad' : 'banner'}>{s.recap.event[r.event]}</p>}
      <Oren expression={orenFor(r.level)} />
      <dl className="facts">
        <div className="fact">
          <dt>{s.recap.job}</dt>
          <dd>{r.employed ? jobTitle(r.titleKey) : s.recap.unemployed}</dd>
        </div>
        {r.employed && (
          <div className="fact">
            <dt>{s.recap.income}</dt>
            <dd>{s.recap.perMonth(formatRupiah(r.monthlyIncome, locale))}</dd>
          </div>
        )}
        <div className="fact">
          <dt>{s.recap.netWorth}</dt>
          <dd>
            {formatRupiah(r.netWorth, locale)}
            <span className="change">{s.recap.change(formatDelta(r.netWorthChange, locale), years)}</span>
          </dd>
        </div>
        <div className="fact">
          <dt>{s.recap.feeling}</dt>
          <dd>{s.feeling[r.level]}</dd>
        </div>
      </dl>
      <div className="actions">
        <button type="button" className="btn" onClick={leaveRecap}>{game.run.finished ? s.recap.finish : s.recap.next}</button>
      </div>
    </section>
  );
}
