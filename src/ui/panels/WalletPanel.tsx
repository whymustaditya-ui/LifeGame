import { toVisible } from '../../engine';
import { Sheet } from '../components/Sheet';
import { formatMonths, formatRupiah } from '../i18n/format';
import { useApp, useLocale, useStrings } from '../store';

/** Dompet: everything a player could check in real life, exact (spec 5.3). Read-only. */
export function WalletPanel() {
  const game = useApp((st) => st.game);
  const closePanel = useApp((st) => st.closePanel);
  const locale = useLocale();
  const s = useStrings();
  if (!game) return null;

  const v = toVisible(game.run.state);
  const w = s.wallet;
  const money = (n: number) => formatRupiah(n, locale);
  const rows: readonly (readonly [string, string])[] = [
    [w.netWorth, money(v.netWorth)],
    [w.cash, money(v.cash)],
    [w.emergency, w.months(formatMonths(v.emergencyMonths, locale))],
    [w.index, money(v.index)],
    [w.property, money(v.property)],
    [w.kpr, money(v.debt.kpr)],
    [w.pinjol, money(v.debt.pinjol)],
    [w.cardDebt, money(v.debt.cardDebt)],
    [w.cover, v.insured ? w.insured : w.bpjsOnly],
    [w.plan, w.planValue[v.plan ?? 'none']],
    [w.income, v.employed ? money(v.monthlyIncome) : w.noIncome],
    [w.costs, money(v.monthlyCosts)],
  ];

  return (
    <Sheet title={w.title} closeLabel={s.common.close} onClose={closePanel}>
      <dl className="wallet">
        {rows.map(([label, value]) => (
          <div key={label} className="wallet-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
