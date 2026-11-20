import type { CSSProperties } from 'react';

type PortraitProps = {
  /** The lines to show (a prefix of `all` while the portrait is being drawn). */
  lines: readonly string[];
  /** All the lines: sizes the box so drawing the portrait doesn't make the page jump. */
  all: readonly string[];
  pending?: boolean;
  /** Box classes: its width, padding and (on desktop) fixed height. */
  className?: string;
};

/**
 * The ASCII portrait, in the light box. The text is 8px at full size and shrinks to fit narrower
 * boxes (a phone), so all the columns show without scrolling or clipping.
 */
export function Portrait({ lines, all, pending, className = '' }: PortraitProps) {
  const columns = Math.max(...all.map((line) => line.length));
  return (
    <div
      role="img"
      aria-label="ASCII portrait of Kushal Shrestha"
      className={`portrait-fit bg-portrait-bg text-bg overflow-hidden ${className}`}
      style={{ '--cols': columns, '--rows': all.length } as CSSProperties}
    >
      <pre aria-hidden="true" data-typing={pending ? 'pending' : undefined}>
        {lines.join('\n')}
      </pre>
    </div>
  );
}
