import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTrail } from '@/components/detail/PageTrail';
import { WriteUp } from '@/components/detail/WriteUp';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { projects } from '@/content/projects';
import { trailFor } from '@/lib/detail';
import { loadSiteTree } from '@/lib/site-load';
import { loadWriteup } from '@/lib/writeups';

export const dynamicParams = false;

export const generateStaticParams = () => achievements.map((a) => ({ id: a.id }));

type Props = { params: Promise<{ id: string }> };

const find = async (params: Props['params']) => {
  const { id } = await params;
  const win = achievements.find((a) => a.id === id);
  if (!win) throw new Error(`unknown achievement: ${id}`);
  return win;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await find(params);
  return { title: a.event, description: `${a.award}. ${a.description}` };
}

export default async function AchievementPage({ params }: Props) {
  const a = await find(params);
  const writeup = await loadWriteup('achievements', a.id);
  const project = projects.find((p) => p.slug === a.project);

  return (
    <TerminalPage prompt="cat README.md" promptPath={`~/leadership/achievements/${a.id}`}>
      <header className="flex flex-col gap-1">
        <h1 className="text-[20px] font-bold">{a.event}</h1>
        <p className="text-yellow">{a.award}</p>
        {a.location || a.year ? (
          <p className="text-fg-dim">{[a.year, a.location].filter(Boolean).join(' · ')}</p>
        ) : null}
        <p>{a.description}</p>
        {project ? (
          <p>
            project: <Link href={`/projects/${project.slug}/`}>{project.name}</Link>
          </p>
        ) : null}
        {a.link ? (
          <p>
            <a href={a.link}>[devpost]</a>
          </p>
        ) : null}
      </header>

      <WriteUp html={writeup.html} name={a.event} />

      <PageTrail trail={trailFor(await loadSiteTree(), `~/leadership/achievements/${a.id}`)} />
    </TerminalPage>
  );
}
