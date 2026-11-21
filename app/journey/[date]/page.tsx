import type { Metadata } from 'next';
import { JourneyEntry } from '@/components/journey/JourneyEntry';
import { PageTrail } from '@/components/detail/PageTrail';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { trailFor } from '@/lib/detail';
import { loadJourney } from '@/lib/journey/load';
import { loadSiteTree } from '@/lib/site-load';
import { permalink } from '@/lib/journey/format';
import { clip } from '@/lib/seo/copy';
import { pageMetadata } from '@/lib/seo/metadata';

export const dynamicParams = false;

/**
 * A static export needs at least one param per dynamic route, and on launch day there may be no
 * entries yet. The placeholder (not a date, so never linked from the tree) renders the 404 page.
 */
const NO_ENTRIES = '_';

export async function generateStaticParams() {
  const entries = await loadJourney();
  return entries.length ? entries.map((e) => ({ date: e.date })) : [{ date: NO_ENTRIES }];
}

type Props = { params: Promise<{ date: string }> };

const find = async (params: Props['params']) => {
  const { date } = await params;
  return (await loadJourney()).find((e) => e.date === date);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await find(params);
  if (!e) return { title: 'journey', robots: { index: false } };
  return pageMetadata({
    title: `day ${e.day} · ${e.date}`,
    description: clip(e.learned),
    path: permalink(e.date),
    keywords: e.tags,
    article: { publishedTime: e.date, tags: e.tags },
  });
}

export default async function JourneyEntryPage({ params }: Props) {
  const e = await find(params);
  if (!e) {
    return (
      <TerminalPage prompt="ls" promptPath="~/journey">
        <h1 className="text-fg-dim">ls: ~/journey: no entries yet</h1>
      </TerminalPage>
    );
  }
  return (
    <TerminalPage prompt="cat README.md" promptPath={`~/journey/${e.date}`}>
      <JourneyEntry entry={e} headingLevel={1} />
      <PageTrail trail={trailFor(await loadSiteTree(), `~/journey/${e.date}`)} />
    </TerminalPage>
  );
}
