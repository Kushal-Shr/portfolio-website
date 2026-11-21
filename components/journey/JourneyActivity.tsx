'use client';

import type { ReactNode } from 'react';
import { Box } from '@/components/terminal/Box';
import { formatDay, parseDay } from '@/lib/journey/dates';
import { RSS_PATH } from '@/lib/journey/format';
import {
  HEATMAP_WEEKS,
  HEATMAP_WEEKS_PHONE,
  heatmap,
  journeyStats,
  type HeatCell,
} from '@/lib/journey/stats';
import { PHONE_QUERY, useMatchMedia } from '@/lib/hooks/useMatchMedia';
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
  const phone = useMatchMedia(PHONE_QUERY);
  const weeks = phone ? HEATMAP_WEEKS_PHONE : HEATMAP_WEEKS;
  const { day, streak, longest } = journeyStats(dates, parseDay(today));
  // The grid always holds all 26 weeks and CSS hides the oldest ones on a phone, so it never
  // changes shape after hydration. The words (title, name, counts) follow the weeks in view.
  const grid = heatmap(dates, parseDay(today), HEATMAP_WEEKS);
  const logged = grid.weeks.slice(-weeks).reduce((n, w) => n + w.filter((c) => c.logged).length, 0);
  const hiddenOnPhone = HEATMAP_WEEKS - HEATMAP_WEEKS_PHONE;

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
        title={`last ${weeks} weeks`}
        ariaLabel={`Activity over the last ${weeks} weeks`}
        className="px-5 pt-6 pb-3.5"
      >
        <p className="sr-only">
          {plural(logged, 'entry', 'entries')} in the last {weeks} weeks. Current streak{' '}
          {plural(streak, 'day')}. Longest streak {plural(longest, 'day')}.
        </p>
        {/* Weeks are columns, so the DOM runs oldest to newest; rows are Sun..Sat. */}
        <div aria-hidden="true" className="flex text-[14px] leading-[1.25] tracking-[3px]">
          <div className="text-fg-dim flex w-[5ch] flex-none flex-col tracking-normal">
            {grid.labels.map((label, i) => (
              <span key={i}>{label || '\u00a0'}</span>
            ))}
          </div>
          {/* Too narrow for 26 weeks (phones): the oldest weeks are hidden, never today's. */}
          <div className="flex min-w-0 flex-1 overflow-hidden">
            {grid.weeks.map((week, i) => (
              <div
                key={week[0]?.date}
                className={`flex flex-none flex-col ${i < hiddenOnPhone ? 'max-sm:hidden' : ''}`}
              >
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
