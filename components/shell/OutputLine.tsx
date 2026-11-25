import Link from 'next/link';
import type { CSSProperties } from 'react';
import { CopyButton } from '@/components/terminal/CopyButton';
import type { Line, Segment, Tone } from '@/lib/shell/types';

export const TONE: Record<Tone, string> = {
  fg: 'text-fg',
  dim: 'text-fg-dim',
  dir: 'text-blue',
  warn: 'text-yellow',
  err: 'text-red',
  ok: 'text-green',
};

function Seg({ segment }: { segment: Segment }) {
  const className = `${TONE[segment.tone ?? 'fg']}${segment.bold ? ' font-bold' : ''}`;
  return <span className={className}>{segment.text}</span>;
}

type OutputLineProps = { line: Exclude<Line, { kind: 'neofetch' }> };

const columns = (rows: Segment[][]): number =>
  Math.max(0, ...rows.map((row) => [...row.map((s) => s.text).join('')].length));

function Rows({ rows, className }: { rows: Segment[][]; className: string }) {
  return (
    <div
      className={`whitespace-pre ${className}`}
      style={{ '--cols': columns(rows) } as CSSProperties}
    >
      {rows.map((row, i) => (
        <div key={i}>
          {row.map((segment, j) => (
            <Seg key={j} segment={segment} />
          ))}
          {/* A blank row still takes a line's height. */}
          {row.every((segment) => !segment.text) ? '\u00a0' : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Text wraps (and a token longer than the line breaks anywhere), so no output is ever wider than
 * the terminal it is printed in.
 */
export function OutputLine({ line }: OutputLineProps) {
  if (line.kind === 'fit') {
    return (
      <div className="shell-fit pl-4">
        <Rows rows={line.wide} className="shell-fit-wide" />
        <Rows rows={line.narrow} className="shell-fit-narrow" />
      </div>
    );
  }
  if (line.kind === 'text') {
    return (
      <div className="pl-4 [overflow-wrap:anywhere] whitespace-pre-wrap">
        {line.segments.map((segment, i) => (
          <Seg key={i} segment={segment} />
        ))}
      </div>
    );
  }
  if (line.kind === 'items') {
    return (
      <div className="flex flex-wrap gap-x-7 pl-4">
        {line.items.map((item, i) => (
          <Seg key={i} segment={item} />
        ))}
      </div>
    );
  }
  // A file (the resume PDF) is not a page: `Link` would try to prefetch it as one and 404.
  const external = line.external || /^(https?:|mailto:)|\.pdf$/.test(line.href);
  return (
    <div className="pl-4 [overflow-wrap:anywhere] whitespace-pre-wrap">
      {line.prefix ? <span className="text-fg-dim">{line.prefix}</span> : null}
      {external ? <a href={line.href}>{line.text}</a> : <Link href={line.href}>{line.text}</Link>}
      {line.copy ? (
        <>
          {' '}
          <CopyButton value={line.copy} what="email" />
        </>
      ) : null}
    </div>
  );
}
