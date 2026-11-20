'use client';

import { useState } from 'react';
import { useInterval } from '@/lib/hooks/useInterval';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;
const STATIC = '⠿';

/** A braille spinner. The server and reduced-motion users get a static glyph. */
export function Spinner() {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);
  useInterval(() => setFrame((f) => (f + 1) % FRAMES.length), reduced ? null : 90);

  return (
    <span aria-hidden="true" className="text-yellow">
      {reduced ? STATIC : FRAMES[frame]}
    </span>
  );
}
