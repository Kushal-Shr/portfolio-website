'use client';

import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useSpinnerFrame } from '@/lib/hooks/useSpinnerFrame';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;
const STATIC = '⠿';

/** A braille spinner. The server and reduced-motion users get a static glyph. */
export function Spinner() {
  const reduced = useReducedMotion();
  const frame = useSpinnerFrame(!reduced);

  return (
    <span aria-hidden="true" className="text-yellow">
      {frame === null ? STATIC : FRAMES[frame % FRAMES.length]}
    </span>
  );
}
