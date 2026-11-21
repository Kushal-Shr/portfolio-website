import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideOutput } from '@/components/guide/GuideOutput';
import { InlineText } from '@/components/guide/InlineText';
import { Box } from '@/components/terminal/Box';
import { Cursor } from '@/components/terminal/Cursor';
import { ScrollX } from '@/components/terminal/ScrollX';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { guide } from '@/content/guide';
import type { GuideItem } from '@/content/types';
import { createGuideContext, renderGuideExample } from '@/lib/guide';
import { ROUTES } from '@/lib/routes';
import { loadSiteFs } from '@/lib/site-load';
import { routeDescriptions } from '@/lib/seo/copy';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'guide',
  description: routeDescriptions.guide,
  path: '/guide/',
});

const prompt = ROUTES.find((r) => r.key === 'guide')?.prompt ?? undefined;

function Example({ item, ctx }: { item: GuideItem; ctx: ReturnType<typeof createGuideContext> }) {
  const runnable = item.kind === 'command';
  const example = item.output
    ? { lines: [{ kind: 'text' as const, segments: [{ text: item.output }] }], truncated: false }
    : renderGuideExample(item.cmd, item, ctx);

  return (
    <div className="flex flex-col gap-1">
      <p className="text-fg-dim">- {item.what}</p>
      <details className="group">
        <summary className="border-line bg-bg-raised group-open:border-green inline-flex min-h-11 w-fit max-w-full cursor-pointer list-none items-center border px-3.5 py-1 [&::-webkit-details-marker]:hidden">
          <span className="whitespace-pre max-sm:[overflow-wrap:anywhere] max-sm:whitespace-pre-wrap">
            <span className="text-fg-dim">$ </span>
            <span className="text-green">{item.cmd}</span>
            <span className="text-fg-dim">
              {'  '}
              {item.hint}
            </span>
          </span>
        </summary>
        <ScrollX label="command output" className="mt-1 ml-[2ch]">
          <pre className="border-green bg-bg-raised border-l-2 px-3 py-2 [overflow-wrap:anywhere] whitespace-pre-wrap">
            <GuideOutput example={example} />
          </pre>
        </ScrollX>
        {runnable ? (
          <p className="mt-1 ml-[2ch]">
            <Link href={`/?run=${encodeURIComponent(item.show ?? item.cmd)}`}>
              ▶ run it in the shell
            </Link>
          </p>
        ) : null}
      </details>
    </div>
  );
}

export default async function GuidePage() {
  // The examples run through the real shell engine at build time.
  const ctx = createGuideContext(new Date(), await loadSiteFs());

  return (
    <TerminalPage prompt={prompt}>
      <div className="grid grid-cols-1 items-start gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[28px] font-bold">
            {guide.title} <span className="text-fg-dim font-normal">{guide.subtitle}</span>
          </h1>
          {guide.intro.map((parts, i) => (
            <p key={i} className={`max-w-[64ch] ${i > 0 ? 'text-fg-dim' : ''}`}>
              <InlineText parts={parts} />
            </p>
          ))}
        </div>
        <Box
          as="aside"
          tone="yellow"
          title={guide.quickStart.title}
          className="flex flex-col gap-1 px-5 pt-[22px] pb-3.5 max-sm:order-first"
        >
          {guide.quickStart.steps.map((parts, i) => (
            <p key={i}>
              <span className="text-green">{i + 1}.</span> <InlineText parts={parts} />
            </p>
          ))}
        </Box>
      </div>

      <div className="grid grid-cols-1 gap-x-7 gap-y-[30px] pt-1.5 min-[900px]:grid-cols-2">
        {guide.sections.map((section) => (
          <Box
            key={section.title}
            title={section.title}
            className="flex min-w-0 flex-col gap-3 px-5 pt-6 pb-3.5"
          >
            {section.items.map((item) => (
              <Example key={item.cmd} item={item} ctx={ctx} />
            ))}
          </Box>
        ))}
      </div>

      <section className="border-line grid grid-cols-1 gap-7 border-t pt-[18px] min-[900px]:grid-cols-3">
        {guide.concepts.map((concept) => (
          <div key={concept.title}>
            <h2 className="text-yellow font-bold">{concept.title}</h2>
            <p className="text-fg-dim">
              <InlineText parts={concept.body} />
            </p>
          </div>
        ))}
      </section>

      <p className="text-fg-dim">
        {guide.footnote} <Cursor />
      </p>
    </TerminalPage>
  );
}
