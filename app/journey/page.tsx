import type { Metadata } from 'next';
import Link from 'next/link';
import { JourneyActivity } from '@/components/journey/JourneyActivity';
import { JourneyEntry } from '@/components/journey/JourneyEntry';
import { Cursor } from '@/components/terminal/Cursor';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { toIsoDay, todayLocal } from '@/lib/journey/dates';
import { ARCHIVE_HREF } from '@/lib/journey/format';
import { loadJourney } from '@/lib/journey/load';
import { JOURNEY_PAGE_SIZE } from '@/lib/journey/types';
import { ROUTES } from '@/lib/routes';
import { routeDescriptions } from '@/lib/seo/copy';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'journey',
  description: routeDescriptions.journey,
  path: '/journey/',
});

const route = ROUTES.find((r) => r.key === 'journey');

export default async function JourneyPage() {
  const entries = await loadJourney();
  const shown = entries.slice(0, JOURNEY_PAGE_SIZE);
  const older = entries.length - shown.length;

  return (
    <TerminalPage prompt={route?.prompt ?? undefined}>
      <JourneyActivity
        dates={entries.map((e) => e.date)}
        buildDay={toIsoDay(todayLocal())}
        title={
          <h1 className="font-normal">
            <span className="text-[20px] font-bold">~/journey</span>
            <span className="text-fg-dim max-sm:block">
              <span className="whitespace-pre max-sm:hidden">{'  ·  '}</span>what I learned and
              built, every single day
            </span>
          </h1>
        }
      />

      {shown.length > 0 ? (
        <>
          <div className="flex flex-col gap-[26px]">
            {shown.map((entry) => (
              <JourneyEntry key={entry.date} entry={entry} />
            ))}
          </div>
          {older > 0 ? (
            <p>
              <Link href={ARCHIVE_HREF} className="inline-flex min-h-11 items-center">
                ls ~/journey/archive
              </Link>
              <span className="text-fg-dim">
                {' '}
                · {older} older {older === 1 ? 'entry' : 'entries'}
              </span>
            </p>
          ) : null}
          <p className="text-fg-dim">
            tail: waiting for tomorrow&apos;s entry <Cursor />
          </p>
        </>
      ) : (
        <p className="text-fg-dim" data-testid="journey-empty">
          tail: ~/journey/log: no entries yet — the first one lands soon <Cursor />
        </p>
      )}
    </TerminalPage>
  );
}
