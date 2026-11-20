import Link from 'next/link';
import { TONE } from '@/components/shell/OutputLine';
import type { GuideExample } from '@/lib/guide';
import type { Segment } from '@/lib/shell/types';

function Seg({ segment }: { segment: Segment }) {
  return (
    <span className={`${TONE[segment.tone ?? 'fg']}${segment.bold ? 'font-bold' : ''}`}>
      {segment.text}
    </span>
  );
}

/** Engine output lines as the text of a `<pre>`. */
export function GuideOutput({ example }: { example: GuideExample }) {
  return (
    <>
      {example.lines.map((line, i) => {
        const sep = i > 0 ? '\n' : '';
        if (line.kind === 'text') {
          return (
            <span key={i}>
              {sep}
              {line.segments.map((s, j) => (
                <Seg key={j} segment={s} />
              ))}
            </span>
          );
        }
        if (line.kind === 'items') {
          return (
            <span key={i}>
              {sep}
              {line.items.map((item, j) => (
                <span key={j}>
                  {j > 0 ? '  ' : ''}
                  <Seg segment={item} />
                </span>
              ))}
            </span>
          );
        }
        if (line.kind === 'link') {
          const external = line.external || /^(https?:|mailto:)/.test(line.href);
          return (
            <span key={i}>
              {sep}
              {line.prefix ? <span className="text-fg-dim">{line.prefix}</span> : null}
              {external ? (
                <a href={line.href}>{line.text}</a>
              ) : (
                <Link href={line.href}>{line.text}</Link>
              )}
            </span>
          );
        }
        return null;
      })}
    </>
  );
}
