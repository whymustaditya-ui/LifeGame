import type { Moment } from '../../engine';
import { MomentIcon } from '../art/icons';
import { useLocale } from '../store';

/** The phone moment a card comes from, drawn like a notification: sender, then the line. */
export function MomentLine({ moment }: { moment: Moment }) {
  const locale = useLocale();
  return (
    <div className="moment">
      <MomentIcon kind={moment.kind} />
      <span>
        <span className="moment-from">{moment.from}</span>
        <span className="moment-copy">{moment.copy[locale]}</span>
      </span>
    </div>
  );
}
