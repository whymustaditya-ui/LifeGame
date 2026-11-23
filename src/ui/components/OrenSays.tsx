import type { ReactNode } from 'react';
import { Oren, type OrenExpression } from '../art/Oren';

/** Oren beside a speech bubble, as in mockup v3. */
export function OrenSays({ expression, children }: { expression: OrenExpression; children: ReactNode }) {
  return (
    <div className="oren-scene">
      <Oren expression={expression} />
      <p className="bubble">{children}</p>
    </div>
  );
}
