import { useId, useRef, useState, type FormEvent } from 'react';
import { RadioTiles, type TileOption } from './RadioTiles';

type Props = {
  legend: string;
  options: readonly TileOption<string>[];
  confirmLabel: string;
  onConfirm: (value: string) => void;
};

/** Select, then confirm. The confirm button locks after the first submit so a double tap resolves once. */
export function ChoiceList({ legend, options, confirmLabel, onConfirm }: Props) {
  const name = useId();
  const [picked, setPicked] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const sentRef = useRef(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (picked === null || sentRef.current) return;
    sentRef.current = true;
    setIsSent(true);
    onConfirm(picked);
  };

  return (
    <form className="actions" onSubmit={handleSubmit}>
      <RadioTiles name={name} legend={legend} options={options} value={picked} onChange={setPicked} />
      <button type="submit" className="btn" disabled={picked === null || isSent}>{confirmLabel}</button>
    </form>
  );
}
