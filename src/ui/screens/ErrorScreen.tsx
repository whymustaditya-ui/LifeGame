import { Oren } from '../art/Oren';
import { useStrings } from '../store';
import './screens.css';

export function ErrorScreen({ onReset }: { onReset: () => void }) {
  const s = useStrings();
  return (
    <section className="screen">
      <Oren expression="shocked" />
      <h1 className="screen-title">{s.error.title}</h1>
      <p className="screen-sub">{s.error.body}</p>
      <div className="actions">
        <button type="button" className="btn" onClick={onReset}>{s.error.action}</button>
      </div>
    </section>
  );
}
