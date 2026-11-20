import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideOutput } from '@/components/guide/GuideOutput';
import { InlineText } from '@/components/guide/InlineText';
import { Box } from '@/components/terminal/Box';
import { Cursor } from '@/components/terminal/Cursor';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { guide } from '@/content/guide';
import type { GuideItem } from '@/content/types';
import { createGuideContext, renderGuideExample } from '@/lib/guide';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'guide' };

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
        <summary className="border-line bg-bg-raised group-open:border-green inline-flex min-h-11 w-fit cursor-pointer list-none items-center border px-3.5 [&::-webkit-details-marker]:hidden">
          <span className="whitespace-pre">
            <span className="text-fg-dim">$ </span>
            <span className="text-green">{item.cmd}</span>
            <span className="text-fg-dim">
              {'  '}
              {item.hint}
            </span>
          </span>
        </summary>
        <pre className="border-green bg-bg-raised mt-1 ml-[2ch] border-l-2 px-3 py-2 whitespace-pre-wrap">
          <GuideOutput example={example} />
        </pre>
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

export default function GuidePage() {
  // The examples run through the real shell engine at build time.
  const ctx = createGuideContext();

  return (
    <TerminalPage prompt={prompt}>
      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-8">
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
          className="flex flex-col gap-1 px-5 pt-[22px] pb-3.5"
        >
          {guide.quickStart.steps.map((parts, i) => (
            <p key={i}>
              <span className="text-green">{i + 1}.</span> <InlineText parts={parts} />
            </p>
          ))}
        </Box>
      </div>

      <div className="grid grid-cols-2 gap-x-7 gap-y-[30px] pt-1.5">
        {guide.sections.map((section) => (
          <Box
            key={section.title}
            title={section.title}
            className="flex flex-col gap-3 px-5 pt-6 pb-3.5"
          >
            {section.items.map((item) => (
              <Example key={item.cmd} item={item} ctx={ctx} />
            ))}
          </Box>
        ))}
      </div>

      <section className="border-line grid grid-cols-3 gap-7 border-t pt-[18px]">
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
