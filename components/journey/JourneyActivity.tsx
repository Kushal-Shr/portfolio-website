'use client';

import type { ReactNode } from 'react';
import { Box } from '@/components/terminal/Box';
import { formatDay, parseDay } from '@/lib/journey/dates';
import { RSS_PATH } from '@/lib/journey/format';
import { HEATMAP_WEEKS, journeyStats, type HeatCell } from '@/lib/journey/stats';
import { useToday } from '@/lib/hooks/useToday';

type JourneyActivityProps = {
  /** Every entry's date (`YYYY-MM-DD`): all the island needs to recompute the stats. */
  dates: readonly string[];
  /** The day the site was built: rendered first, then replaced with the viewer's today. */
  buildDay: string;
  /** The header's left side (with the page's `<h1>`), rendered on the server. */
  title: ReactNode;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Cell({ cell }: { cell: HeatCell }) {
  if (cell.future) return <span>{' '}</span>;
  if (cell.logged) {
    return (
      <span className="text-green" data-logged="" title={formatDay(parseDay(cell.date))}>
        █
      </span>
    );
  }
  return <span className="text-line-strong">·</span>;
}

/**
 * The header's `day N · streak N days` and the 26-week heatmap. A static site is built once and
 * served for days, so both are recomputed from the viewer's own date after hydration.
 */
export function JourneyActivity({ dates, buildDay, title }: JourneyActivityProps) {
  const today = useToday(buildDay);
  const { day, streak, longest, grid } = journeyStats(dates, parseDay(today));

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        {title}
        <p className="text-fg-dim" data-testid="journey-stats">
          day <span className="text-green font-bold">{day}</span> · streak{' '}
          <span className="text-yellow font-bold">{plural(streak, 'day')}</span>
          {longest > streak ? (
            <>
              {' '}
              · longest <span className="text-fg font-bold">{plural(longest, 'day')}</span>
            </>
          ) : null}{' '}
          · <a href={RSS_PATH}>journey.rss</a>
        </p>
      </div>

      <Box
        title={`last ${HEATMAP_WEEKS} weeks`}
        ariaLabel={`Activity over the last ${HEATMAP_WEEKS} weeks`}
        className="px-5 pt-6 pb-3.5"
      >
        <p className="sr-only">
          {plural(grid.logged, 'entry', 'entries')} in the last {HEATMAP_WEEKS} weeks. Current
          streak {plural(streak, 'day')}. Longest streak {plural(longest, 'day')}.
        </p>
        {/* Weeks are columns, so the DOM runs oldest to newest; rows are Sun..Sat. */}
        <div aria-hidden="true" className="flex text-[14px] leading-[1.25] tracking-[3px]">
          <div className="text-fg-dim flex w-[5ch] flex-none flex-col tracking-normal">
            {grid.labels.map((label, i) => (
              <span key={i}>{label || '\u00a0'}</span>
            ))}
          </div>
          {/* Too narrow for 26 weeks (phones): clip the oldest weeks, never today's. */}
          <div className="flex min-w-0 flex-1 overflow-hidden max-sm:justify-end">
            {grid.weeks.map((week) => (
              <div key={week[0]?.date} className="flex flex-none flex-col">
                {week.map((cell) => (
                  <Cell key={cell.date} cell={cell} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="text-fg-dim pt-2 text-[13px] whitespace-pre">
          <span aria-hidden="true">· </span>no entry{'   '}
          <span aria-hidden="true" className="text-green">
            █{' '}
          </span>
          entry logged
        </p>
      </Box>
    </>
  );
}
