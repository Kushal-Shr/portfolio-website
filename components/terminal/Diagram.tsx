type DiagramProps = {
  text: string;
  alt: string;
  className?: string;
};

/** ASCII art is hidden from assistive tech; `alt` carries the same information as text. */
export function Diagram({ text, alt, className = '' }: DiagramProps) {
  return (
    <div>
      <pre aria-hidden="true" className={`text-blue ${className}`.trim()}>
        {text}
      </pre>
      <p className="sr-only">{alt}</p>
    </div>
  );
}
