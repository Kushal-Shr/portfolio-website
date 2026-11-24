import type { Metadata } from 'next';
import Link from 'next/link';
import { HangingList } from '@/components/terminal/HangingList';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { experience, now } from '@/content/experience';
import { projects } from '@/content/projects';
import { formatRange } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import { routeDescriptions } from '@/lib/seo/copy';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'experience',
  description: routeDescriptions.experience,
  path: '/experience/',
});

const prompt = ROUTES.find((r) => r.key === 'experience')?.prompt ?? undefined;

export default function ExperiencePage() {
  const oldest = [...experience].sort((a, b) => a.start.localeCompare(b.start))[0];
  const initialCommit = oldest
    ? `${(oldest.location ?? '').split(',')[0]}, ${oldest.start.slice(0, 4)}`
    : '';

  return (
    <TerminalPage prompt={prompt}>
      <h1 className="sr-only">Experience</h1>
      <p className="text-fg-dim">git log --graph · {experience.length} roles · newest first</p>
      <div className="flex flex-col">
        <article className="flex gap-5">
          <div aria-hidden="true" className="flex w-3 flex-none flex-col items-start">
            <span className="text-green font-bold">*</span>
            <div className="border-line-strong ml-1 w-0 flex-1 border-l" />
          </div>
          <div className="flex min-w-0 flex-col gap-1 pb-7">
            <p>
              <span className="text-blue font-bold">(HEAD -&gt; main)</span>{' '}
              <span className="text-fg-dim">uncommitted changes</span>
            </p>
            <h2 className="text-[17px] font-bold sm:text-[20px]">{now.title}</h2>
            <p className="text-fg-dim">
              Date: now · working on{' '}
              {now.building.map(({ project: slug }, i) => {
                const p = projects.find((x) => x.slug === slug);
                return p ? (
                  <span key={slug}>
                    {i > 0 ? ' · ' : ''}
                    <Link href={`/projects/${slug}/`}>{p.name}</Link>
                  </span>
                ) : null;
              })}
            </p>
          </div>
        </article>
        {experience.map((e, i) => {
          const last = i === experience.length - 1;
          const where = [e.workMode, e.location].filter(Boolean).join(', ');
          return (
            <article key={e.id} className="flex gap-5">
              <div aria-hidden="true" className="flex w-3 flex-none flex-col items-start">
                <span className="text-yellow font-bold">*</span>
                {last ? null : <div className="border-line-strong ml-1 w-0 flex-1 border-l" />}
              </div>
              <div className="flex min-w-0 flex-col gap-1 pb-7">
                <p>
                  <Link
                    href={`/experience/${e.id}/`}
                    className="link-quiet text-yellow inline-block min-h-6"
                  >
                    commit {e.commit}
                  </Link>
                </p>
                <h2 className="text-[17px] font-bold sm:text-[20px]">
                  <Link href={`/experience/${e.id}/`} className="link-quiet">
                    {e.title}
                    {e.titleNote ? ` (${e.titleNote})` : ''} @ {e.org}
                  </Link>
                </h2>
                <p className="text-fg-dim">
                  Date: {formatRange(e.start, e.end, 'arrow')} · {where}
                </p>
                <HangingList items={e.bullets} className="pl-[2ch] sm:pl-[4ch]" />
                <p className="text-fg-dim pl-[2ch] sm:pl-[4ch]">
                  stack: <span className="text-fg">{e.stack.join(' · ')}</span>
                </p>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-fg-dim">
        initial commit: {initialCommit} · see also <Link href="/leadership/">~/leadership</Link> and{' '}
        <Link href="/resume/">resume.txt</Link>
      </p>
    </TerminalPage>
  );
}
