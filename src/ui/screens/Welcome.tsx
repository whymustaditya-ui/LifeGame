import { useId } from 'react';
import { NICKNAME_MAX } from '../../app/save';
import type { Locale } from '../../engine';
import { Oren } from '../art/Oren';
import { RadioTiles } from '../components/RadioTiles';
import { useApp, useLocale, useStrings } from '../store';
import './screens.css';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'jaksel', label: 'Jaksel' },
] as const satisfies readonly { value: Locale; label: string }[];

/** Pick a language (copy switches live), an optional nickname, then start (spec 5.1). */
export function Welcome() {
  const nickname = useApp((st) => st.nickname);
  const setNickname = useApp((st) => st.setNickname);
  const setLocale = useApp((st) => st.setLocale);
  const start = useApp((st) => st.start);
  const locale = useLocale();
  const s = useStrings();
  const inputId = useId();
  const hintId = useId();

  return (
    <section className="screen welcome">
      <Oren expression="happy" size={96} />
      <h1 className="welcome-title">Lifeworth</h1>
      <p className="welcome-tagline">{s.welcome.tagline}</p>
      <RadioTiles name="welcome-language" legend={s.welcome.language} options={LANGUAGES} value={locale} onChange={setLocale} />
      <div className="field">
        <label htmlFor={inputId} className="field-label">{s.welcome.nickname}</label>
        <input
          id={inputId}
          className="field-input"
          type="text"
          value={nickname}
          maxLength={NICKNAME_MAX}
          autoComplete="off"
          aria-describedby={hintId}
          onChange={(e) => setNickname(e.target.value)}
        />
        <p id={hintId} className="field-hint">{s.welcome.nicknameHint}</p>
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={start}>{s.welcome.start}</button>
        <p className="fine-print">{s.welcome.disclaimer}</p>
      </div>
    </section>
  );
}
