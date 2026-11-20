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
 * than its box (a phone), it scrolls sideways inside its own container.
 */
export function Diagram({ text, alt, className = '', label = 'diagram' }: DiagramProps) {
  return (
    <div className="min-w-0">
      <ScrollX label={label}>
        <pre aria-hidden="true" className={`text-blue ${className}`.trim()}>
          {text}
        </pre>
      </ScrollX>
      <p className="sr-only">{alt}</p>
    </div>
  );
}
