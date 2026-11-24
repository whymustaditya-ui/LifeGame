import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const DEFAULT_SECONDS = 0.6;

/** Counts from the previous target to the new one; jumps straight there under reduced motion. */
export function useCountUp(target: number, seconds = DEFAULT_SECONDS): number {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    from.current = target;
    if (reduce || start === target) {
      setShown(target);
      return undefined;
    }
    const controls = animate(start, target, {
      duration: seconds,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => setShown(target),
    });
    return () => controls.stop();
  }, [target, reduce, seconds]);

  return reduce ? target : shown;
}
