import Link from 'next/link';
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

export function OutputLine({ line }: OutputLineProps) {
  if (line.kind === 'text') {
    return (
      <div className="pl-4 whitespace-pre-wrap">
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
  const external = line.external || /^(https?:|mailto:)/.test(line.href);
  return (
    <div className="pl-4 whitespace-pre">
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
