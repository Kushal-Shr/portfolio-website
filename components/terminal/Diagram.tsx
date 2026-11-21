import { ScrollX } from './ScrollX';

type DiagramProps = {
  text: string;
  alt: string;
  className?: string;
  /** What the picture is, for the scrolling region's name. */
  label?: string;
};

/**
 * ASCII art is hidden from assistive tech; `alt` carries the same information as text. Wider
 * than its box (a phone), it scrolls sideways inside its own container. The 1.3 line-height is just
 * under JetBrains Mono's natural 1.32, so the vertical strokes of the box glyphs touch from row to row.
 */
export function Diagram({ text, alt, className = '', label = 'diagram' }: DiagramProps) {
  return (
    <div className="min-w-0">
      <ScrollX label={label}>
        <pre aria-hidden="true" className={`text-blue leading-[1.3] ${className}`.trim()}>
          {text}
        </pre>
      </ScrollX>
      <p className="sr-only">{alt}</p>
    </div>
  );
}
