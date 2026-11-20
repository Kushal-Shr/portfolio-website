import type { Metadata } from 'next';
import Link from 'next/link';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { experience } from '@/content/experience';
import { formatRange } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'experience' };

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
        {experience.map((e, i) => {
          const last = i === experience.length - 1;
          const where = [e.workMode, e.location].filter(Boolean).join(', ');
          return (
            <article key={e.id} className="flex gap-5">
              <div aria-hidden="true" className="flex w-3 flex-none flex-col items-start">
                <span className="text-yellow font-bold">*</span>
                {last ? null : <div className="border-line-strong ml-1 w-0 flex-1 border-l" />}
              </div>
              <div className="flex flex-col gap-1 pb-7">
                <p>
                  <span className="text-yellow">commit {e.commit}</span>
                  {i === 0 ? <span className="text-blue font-bold"> (HEAD -&gt; main)</span> : null}
                </p>
                <h2 className="text-[20px] font-bold">
                  {e.title}
                  {e.titleNote ? ` (${e.titleNote})` : ''} @ {e.org}
                </h2>
                <p className="text-fg-dim">
                  Date: {formatRange(e.start, e.end, 'arrow')} · {where}
                </p>
                <pre className="pl-[4ch]">{e.bullets.map((b) => `- ${b}`).join('\n')}</pre>
                <p className="text-fg-dim pl-[4ch]">
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
