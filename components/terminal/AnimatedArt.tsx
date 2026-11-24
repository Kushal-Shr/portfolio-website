'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useArtFrame } from '@/lib/hooks/useArtFrame';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

type AnimatedArtProps = {
  /** Every frame has the same lines and width; the last one is the finished picture. */
  frames: readonly string[];
  /** Pictures that carry meaning get alt text; decorative ones leave it out. */
  alt?: string;
  /** Full-size font in px. Narrower boxes shrink the picture until every column fits. */
  size?: number;
  className?: string;
};

/**
 * An ASCII picture that plays its frames on a loop while it is on screen. The server, visitors
 * without JavaScript and reduced-motion visitors get the finished picture, which is also the
 * last frame of every loop. The glyphs are hidden from assistive tech, which reads `alt` instead.
 */
export function AnimatedArt({ frames, alt, size = 13, className = '' }: AnimatedArtProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(!!entry?.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const tick = useArtFrame(onScreen && !reduced && frames.length > 1);
  const final = frames[frames.length - 1] ?? '';
  const art = tick === null ? final : (frames[tick % frames.length] ?? final);
  const cols = Math.max(0, ...final.split('\n').map((line) => [...line].length));

  return (
    <div
      ref={ref}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      className={`art-fit ${className}`.trim()}
      style={{ '--cols': cols, '--art-size': `${size}px` } as CSSProperties}
    >
      <pre aria-hidden="true">{art}</pre>
    </div>
  );
}
