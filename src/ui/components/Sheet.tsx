import { m } from 'motion/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CloseIcon } from '../art/icons';
import './chrome.css';

type Props = { title: string; closeLabel: string; onClose: () => void; children: ReactNode };

/** A modal bottom sheet: takes focus, closes on Escape or a backdrop tap, and gives focus back on close. */
export function Sheet({ title, closeLabel, onClose, children }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="sheet-layer">
      <m.div className="sheet-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <m.div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'tween', ease: [0.2, 0.8, 0.2, 1], duration: 0.3 }}
      >
        <div className="sheet-head">
          <h2 id={titleId} className="sheet-title">{title}</h2>
          <button ref={closeRef} type="button" className="icon-btn" aria-label={closeLabel} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </m.div>
    </div>
  );
}
