import './tiles.css';

export interface TileOption<T extends string> { value: T; label: string; note?: string }

type Props<T extends string> = {
  name: string;
  legend: string;
  options: readonly TileOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

/** Native radios styled as tiles. Every tile has the same classes; the checked state alone styles the pick. */
export function RadioTiles<T extends string>({ name, legend, options, value, onChange }: Props<T>) {
  return (
    <fieldset className="tiles">
      <legend className="visually-hidden">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="tile">
          <input
            type="radio"
            className="visually-hidden"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span>{o.label}</span>
          {o.note && <span className="tile-note">{o.note}</span>}
        </label>
      ))}
    </fieldset>
  );
}
