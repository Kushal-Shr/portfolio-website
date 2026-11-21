import type { HTMLAttributes } from 'react';
import { Cursor } from './Cursor';

type TypedCharsProps = {
  /** The full text. It is always laid out in full, so typing never moves anything. */
  text: string;
  /** How many characters have been typed so far. */
  count: number;
  /** Show the blinking cursor after the last typed character. */
  cursor?: boolean;
  cursorClassName?: string;
  /** Attributes for the element that holds the typed text (a test id, `data-typing`). */
  typedProps?: HTMLAttributes<HTMLSpanElement> & { 'data-testid'?: string; 'data-typing'?: string };
};

/**
 * Text that is typed out without any layout shift. The untyped rest stays in the line, only
 * `visibility: hidden`, so every word is wrapped as it will be at the end and nothing jumps to
 * the next line as it grows. While typing, the cursor is drawn on top of a zero-width spot and a
 * hidden non-breaking space holds the 1ch it needs at the end of the line, so the line breaks the
 * same way with or without it. Once typed, it is plain text with an inline cursor.
 */
export function TypedChars({
  text,
  count,
  cursor = false,
  cursorClassName = '',
  typedProps,
}: TypedCharsProps) {
  const typing = count < text.length;
  if (!typing) {
    return (
      <>
        <span {...typedProps}>{text}</span>
        {cursor ? <Cursor className={cursorClassName} /> : null}
      </>
    );
  }
  return (
    <>
      <span {...typedProps}>{text.slice(0, count)}</span>
      {cursor ? (
        <span className="relative">
          <Cursor
            className={`absolute top-1/2 left-0 -translate-y-1/2 ${cursorClassName}`.trim()}
          />
        </span>
      ) : null}
      <span className="invisible">{text.slice(count)}</span>
      {cursor ? <span className="invisible">{' '}</span> : null}
    </>
  );
}
