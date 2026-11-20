import Link from 'next/link';
import type { Inline } from '@/content/types';

const TONE = { green: 'text-green', fg: 'text-fg' } as const;

/** Renders content `Inline` segments: plain text, tinted text, or an internal link. */
export function InlineText({ parts }: { parts: readonly Inline[] }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <span key={i}>{part}</span>;
        if (part.href) {
          return (
            <Link key={i} href={part.href}>
              {part.text}
            </Link>
          );
        }
        return (
          <span key={i} className={part.tone ? TONE[part.tone] : undefined}>
            {part.text}
          </span>
        );
      })}
    </>
  );
}
