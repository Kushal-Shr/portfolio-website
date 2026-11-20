type CursorProps = { className?: string };

export function Cursor({ className = '' }: CursorProps) {
  return (
    <span aria-hidden="true" className={`cursor-blink text-green ${className}`.trim()}>
      █
    </span>
  );
}
