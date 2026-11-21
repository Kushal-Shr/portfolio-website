import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTrail } from '@/components/detail/PageTrail';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { trailFor } from '@/lib/detail';
import { archiveLine, groupByMonth, permalink } from '@/lib/journey/format';
import { loadJourneyMeta } from '@/lib/journey/load';
import { JOURNEY_ARCHIVE_PATH } from '@/lib/site-tree';
import { loadSiteTree } from '@/lib/site-load';
import { routeDescriptions } from '@/lib/seo/copy';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'journey archive',
  description: routeDescriptions.archive,
  path: '/journey/archive/',
});

export default async function JourneyArchivePage() {
  const entries = await loadJourneyMeta();
  const months = groupByMonth(entries);
  const trail = trailFor(await loadSiteTree(), JOURNEY_ARCHIVE_PATH);

  return (
    <TerminalPage prompt="cat archive.log" promptPath="~/journey">
      <h1 className="font-normal">
        <span className="text-[20px] font-bold">~/journey/archive.log</span>
        <span className="text-fg-dim max-sm:block">
          <span className="whitespace-pre max-sm:hidden">{'  ·  '}</span>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}, newest first
        </span>
      </h1>
      {months.length === 0 ? (
        <p className="text-fg-dim">archive.log: no entries yet</p>
      ) : (
        months.map((month) => (
          <section key={month.key} aria-labelledby={`m-${month.key}`} className="flex flex-col">
            <h2 id={`m-${month.key}`} className="text-yellow font-bold">
              # {month.label}
            </h2>
            <ul className="m-0 list-none p-0">
              {month.entries.map((e) => {
                const { day, learned } = archiveLine(e);
                return (
                  <li key={e.date} className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                    <Link href={permalink(e.date)}>{e.date}</Link>
                    <span className="text-fg-dim">{day}</span>
                    {learned}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      <PageTrail trail={{ ...trail, prev: undefined, next: undefined }} />
    </TerminalPage>
  );
}
