import type { Locale } from '../../engine';
import { RadioTiles } from '../components/RadioTiles';
import { Sheet } from '../components/Sheet';
import { useApp, useLocale, useStrings } from '../store';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'jaksel', label: 'Jaksel' },
] as const satisfies readonly { value: Locale; label: string }[];

/** Pause: switch language live, keep playing, or end this run. */
export function MenuPanel() {
  const closePanel = useApp((st) => st.closePanel);
  const setLocale = useApp((st) => st.setLocale);
  const quit = useApp((st) => st.quit);
  const locale = useLocale();
  const s = useStrings();

  return (
    <Sheet title={s.menu.title} closeLabel={s.common.close} onClose={closePanel}>
      <RadioTiles name="menu-language" legend={s.welcome.language} options={LANGUAGES} value={locale} onChange={setLocale} />
      <div className="actions">
        <button type="button" className="btn" onClick={closePanel}>{s.menu.resume}</button>
        <button type="button" className="btn btn-danger" onClick={quit}>{s.menu.restart}</button>
        <p className="sheet-note">{s.menu.restartNote}</p>
      </div>
    </Sheet>
  );
}
