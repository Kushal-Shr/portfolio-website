'use client';

import { useRef, type ReactNode } from 'react';
import { useScrollFade } from '@/lib/hooks/useScrollFade';

type ScrollXProps = {
  /** What scrolls, for screen readers: "architecture diagram" reads as "…, scrolls sideways". */
  label: string;
  className?: string;
  children: ReactNode;
};

/**
 * The one place a page may scroll sideways: ASCII diagrams, the resume, tables. It fades at the
 * edges that have more, and is a focusable region (so keyboard users can scroll it) only while
 * its content really overflows.
 */
export function ScrollX({ label, className = '', children }: ScrollXProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFade(ref, { label: `${label}, scrolls sideways` });
  return (
    <div ref={ref} data-scroll-x="" className={className}>
      {children}
    </div>
  );
}
