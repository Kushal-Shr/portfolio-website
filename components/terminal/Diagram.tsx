import type { CSSProperties } from 'react';
import { ScrollX } from './ScrollX';

type DiagramProps = {
  text: string;
  alt: string;
  /** Classes for the wrapper; a text size set here is the diagram's full size. */
  className?: string;
  /** What the picture is, for the scrolling region's name. */
  label?: string;
};

/**
 * ASCII art is hidden from assistive tech; `alt` carries the same information as text. On a phone
 * it shrinks to fit its box (`.diagram-fit`, which needs the column count) and only scrolls
 * sideways when that would make it too small to read. The 1.3 line-height is just under JetBrains
 * Mono's natural 1.32, so the vertical strokes of the box glyphs touch from row to row.
 */
export function Diagram({ text, alt, className = '', label = 'diagram' }: DiagramProps) {
  const cols = Math.max(...text.split('\n').map((line) => [...line].length));
  return (
    <div
      className={`diagram-fit min-w-0 ${className}`.trim()}
      style={{ '--cols': cols } as CSSProperties}
    >
      <ScrollX label={label}>
        <pre aria-hidden="true" className="text-blue leading-[1.3]">
          {text}
        </pre>
      </ScrollX>
      <p className="sr-only">{alt}</p>
    </div>
  );
}
