import { shownCard } from '../../app/flow';
import { levelOf, type Card, type Locale } from '../../engine';
import { Heart } from '../art/Heart';
import { orenFor } from '../art/Oren';
import { ChoiceList } from '../components/ChoiceList';
import { MomentLine } from '../components/MomentLine';
import { OrenSays } from '../components/OrenSays';
import { TopBar } from '../components/TopBar';
import type { Strings } from '../i18n/strings';
import { useApp, useLocale, useStrings } from '../store';
import './screens.css';

type ActionsProps = { card: Card; locale: Locale; s: Strings; onPick: (choiceId: string) => void };

/** A luck card gets one button; a one-choice card gets one button; otherwise select, then confirm. */
function CardActions({ card, locale, s, onPick }: ActionsProps) {
  const choices = card.choices ?? [];
  const only = choices.length === 1 ? choices[0] : undefined;
  if (card.kind === 'luck' || only) {
    const label = only ? only.copy[locale].label : s.card.seeWhat;
    return (
      <div className="actions">
        <button type="button" className="btn" onClick={() => onPick(only ? only.id : 'ok')}>{label}</button>
      </div>
    );
  }
  const options = choices.map((c) => ({ value: c.id, label: c.copy[locale].label, note: c.copy[locale].note }));
  return <ChoiceList legend={s.card.options} options={options} confirmLabel={s.card.choose} onConfirm={onPick} />;
}

export function CardScreen() {
  const game = useApp((st) => st.game);
  const content = useApp((st) => st.content);
  const pick = useApp((st) => st.pick);
  const locale = useLocale();
  const s = useStrings();
  const card = game ? shownCard(game, content) : null;
  if (!game || !card) return null;

  const state = game.run.state;
  const level = levelOf(state.wellbeing);
  const isStruggling = level === 'capek' || level === 'burnout';

  return (
    <section className="screen">
      <TopBar />
      <h1 className="screen-title">{s.card.title[card.kind](state.age)}</h1>
      {isStruggling && (
        <p className="warning">
          <Heart level={level} />
          {level === 'burnout' ? s.card.warning.burnout : s.card.warning.capek}
        </p>
      )}
      {card.moment && <MomentLine moment={card.moment} />}
      <OrenSays expression={orenFor(level)}>{card.copy[locale]}</OrenSays>
      <CardActions key={card.id} card={card} locale={locale} s={s} onPick={pick} />
    </section>
  );
}
