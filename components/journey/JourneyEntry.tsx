import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatDay, parseDay } from '@/lib/journey/dates';
import { permalink } from '@/lib/journey/format';
import type { JourneyEntry as Entry } from '@/lib/journey/types';

type JourneyEntryProps = {
  entry: Entry;
  /** `1` on the entry's own page; `2` in the log, where the heading links to that page. */
  headingLevel?: 1 | 2;
};

// Long enough to fill any line; the overflow is clipped, so the rule always ends at the edge.
const RULE = '─'.repeat(160);

/** `github.com/Kushal-Shr/foo` for `https://github.com/Kushal-Shr/foo/`. */
const shortUrl = (href: string): string => href.replace(/^https:\/\//, '').replace(/\/$/, '');

export function JourneyEntry({ entry: e, headingLevel = 2 }: JourneyEntryProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const label = `day ${e.day} · ${formatDay(parseDay(e.date))}`;
  const rows: { label: string; tone: string; value: ReactNode }[] = [
    { label: 'learned', tone: 'text-green', value: e.learned },
    {
      label: 'built',
      tone: 'text-blue',
      value: (
        <>
          {e.built}
          {e.builtLink ? (
            <>
              {' '}
              <a href={e.builtLink} className="break-all">
                ↗ {shortUrl(e.builtLink)}
              </a>
            </>
          ) : null}
        </>
      ),
    },
  ];
  if (e.stuckOn) rows.push({ label: 'stuck on', tone: 'text-red', value: e.stuckOn });
  rows.push({ label: 'next', tone: 'text-fg-dim', value: e.next });

  return (
    <article id={e.date} className="flex scroll-mt-6 flex-col gap-1">
      <Heading className="text-yellow flex font-bold whitespace-pre">
        <span aria-hidden="true">── </span>
        {headingLevel === 2 ? (
          <Link href={permalink(e.date)} className="link-quiet">
            {label}
          </Link>
        ) : (
          <span>{label}</span>
        )}
        <span aria-hidden="true" className="min-w-0 flex-1 overflow-hidden">
          {` ${RULE}`}
        </span>
      </Heading>
      <dl className="m-0 grid grid-cols-[9ch_minmax(0,1fr)] gap-y-0.5 pl-[2ch] sm:grid-cols-[12ch_minmax(0,1fr)]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className={row.tone}>{row.label}</dt>
            <dd className="m-0 min-w-0 [overflow-wrap:anywhere]">{row.value}</dd>
          </div>
        ))}
      </dl>
      {e.tags.length > 0 ? (
        <p className="text-fg-dim pl-[2ch]">
          tags: <span className="text-purple">{e.tags.map((t) => `#${t}`).join(' ')}</span>
        </p>
      ) : null}
      {e.bodyHtml ? (
        <div
          className="prose-term mt-2 pl-[2ch]"
          dangerouslySetInnerHTML={{ __html: e.bodyHtml }}
        />
      ) : null}
    </article>
  );
}
