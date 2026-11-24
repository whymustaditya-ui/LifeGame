import { END_AGE, levelOf, toVisible } from '../../engine';
import { Heart } from '../art/Heart';
import { CloseIcon, CoinIcon } from '../art/icons';
import { formatShort } from '../i18n/format';
import { useApp, useLocale, useStrings } from '../store';
import { useCountUp } from '../use-count-up';
import './chrome.css';

/** Menu, life progress, the feeling (never a number) and net worth, which opens Dompet. */
export function TopBar() {
  const game = useApp((st) => st.game);
  const openPanel = useApp((st) => st.openPanel);
  const locale = useLocale();
  const s = useStrings();
  const netWorth = game ? toVisible(game.run.state).netWorth : 0;
  const shown = useCountUp(netWorth);
  if (!game) return null;

  const state = game.run.state;
  const startAge = state.start.startAge;
  const progress = state.history.length / (END_AGE - startAge + 1);
  const level = levelOf(state.wellbeing);
  const word = s.feeling[level];

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar-menu" aria-label={s.topBar.menu} onClick={() => openPanel('menu')}>
        <CloseIcon />
      </button>
      <div
        className="lifebar"
        role="progressbar"
        aria-label={s.topBar.age(state.age)}
        aria-valuemin={startAge}
        aria-valuemax={END_AGE}
        aria-valuenow={state.age}
      >
        <div className="lifebar-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>
      <span className="topbar-stat" aria-label={s.topBar.feeling(word)}>
        <Heart level={level} />
        {word}
      </span>
      <button
        type="button"
        className="topbar-stat topbar-money"
        aria-label={s.topBar.wallet(formatShort(netWorth, locale))}
        onClick={() => openPanel('wallet')}
      >
        <CoinIcon />
        {formatShort(shown, locale)}
      </button>
    </header>
  );
}
