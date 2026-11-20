import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTrail } from '@/components/detail/PageTrail';
import { WriteUp } from '@/components/detail/WriteUp';
import { HangingList } from '@/components/terminal/HangingList';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { experience } from '@/content/experience';
import { profile } from '@/content/profile';
import { skillFor, trailFor } from '@/lib/detail';
import { formatRange } from '@/lib/format';
import { loadSiteTree } from '@/lib/site-load';
import { loadWriteup } from '@/lib/writeups';

export const dynamicParams = false;

export const generateStaticParams = () => experience.map((e) => ({ id: e.id }));

type Props = { params: Promise<{ id: string }> };

const find = async (params: Props['params']) => {
  const { id } = await params;
  const index = experience.findIndex((e) => e.id === id);
  const job = experience[index];
  if (!job) throw new Error(`unknown role: ${id}`);
  return { job, index };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { job } = await find(params);
  return { title: `${job.title} @ ${job.orgShort ?? job.org}`, description: job.summary };
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { job: e, index } = await find(params);
  const writeup = await loadWriteup('experience', e.id);
  const where = [e.workMode, e.location].filter(Boolean).join(', ');

  return (
    <TerminalPage prompt={`git show ${e.commit}`} promptPath={`~/experience/${e.id}`}>
      <div className="flex flex-col gap-1">
        <p>
          <span className="text-yellow">commit {e.commit}</span>
          {index === 0 ? <span className="text-blue font-bold"> (HEAD -&gt; main)</span> : null}
        </p>
        <p className="text-fg-dim">Author: {profile.name}</p>
        <p className="text-fg-dim">
          Date: {formatRange(e.start, e.end, 'arrow')}
          {where ? ` · ${where}` : ''}
        </p>
        <div className="flex flex-col gap-1 pt-2 pl-[2ch] sm:pl-[4ch]">
          <h1 className="text-[20px] font-bold">
            {e.title}
            {e.titleNote ? ` (${e.titleNote})` : ''} @ {e.org}
          </h1>
          <HangingList items={e.bullets} />
          <p className="text-fg-dim">
            stack:{' '}
            <span className="text-fg">
              {e.stack.map((name, i) => {
                const skill = skillFor(name);
                return (
                  <span key={name}>
                    {i > 0 ? ' · ' : ''}
                    {skill ? (
                      <Link href={`/skills/${skill.slug}/`} className="link-quiet">
                        {name}
                      </Link>
                    ) : (
                      name
                    )}
                  </span>
                );
              })}
            </span>
          </p>
        </div>
      </div>

      <WriteUp html={writeup.html} name={`${e.title} @ ${e.orgShort ?? e.org}`} />

      <PageTrail trail={trailFor(await loadSiteTree(), `~/experience/${e.id}`)} />
    </TerminalPage>
  );
}
