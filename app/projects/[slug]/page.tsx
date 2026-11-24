import type { Metadata } from 'next';
import Link from 'next/link';
import { DetailHeader } from '@/components/detail/DetailHeader';
import { MetaGrid, type MetaRow } from '@/components/detail/MetaGrid';
import { PageTrail } from '@/components/detail/PageTrail';
import { WriteUp } from '@/components/detail/WriteUp';
import { Bullets } from '@/components/terminal/Bullets';
import { Box } from '@/components/terminal/Box';
import { Diagram } from '@/components/terminal/Diagram';
import { AnimatedArt } from '@/components/terminal/AnimatedArt';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { projectArt } from '@/content/art';
import { achievements } from '@/content/achievements';
import { projects } from '@/content/projects';
import { skillFor, trailFor } from '@/lib/detail';
import { loadSiteTree } from '@/lib/site-load';
import { loadWriteup } from '@/lib/writeups';
import { projectMeta } from '@/lib/seo/copy';
import { pageMetadata } from '@/lib/seo/metadata';

export const dynamicParams = false;

export const generateStaticParams = () => projects.map((p) => ({ slug: p.slug }));

type Props = { params: Promise<{ slug: string }> };

const find = async (params: Props['params']) => {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) throw new Error(`unknown project: ${slug}`);
  return project;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await find(params);
  return pageMetadata({
    title: p.name,
    path: `/projects/${p.slug}/`,
    ...projectMeta(p),
  });
}

export default async function ProjectPage({ params }: Props) {
  const p = await find(params);
  const writeup = await loadWriteup('projects', p.slug);
  const art = projectArt[p.slug];
  const wins = achievements.filter((a) => a.project === p.slug);

  const rows: MetaRow[] = [];
  if (p.outcome) rows.push({ label: p.outcome.label, value: p.outcome.text });
  rows.push({
    label: 'stack',
    value: p.resumeStack.map((name, i) => {
      const skill = skillFor(name);
      return (
        <span key={name}>
          {i > 0 ? ', ' : ''}
          {skill ? (
            <Link href={`/skills/${skill.slug}/`} className="link-quiet">
              {name}
            </Link>
          ) : (
            name
          )}
        </span>
      );
    }),
  });
  if (p.team) rows.push({ label: 'team', value: `team of ${p.team.size}` });
  rows.push({
    label: 'links',
    value: (
      <>
        {p.links.source ? <a href={p.links.source}>[source]</a> : null}{' '}
        {p.links.devpost ? <a href={p.links.devpost}>[devpost]</a> : null}
      </>
    ),
  });
  rows.push({
    label: 'tags',
    value: <span className="text-purple">{p.tags.map((t) => `#${t}`).join(' ')}</span>,
  });

  return (
    <TerminalPage prompt="cat README.md" promptPath={`~/projects/${p.slug}`}>
      <div className="flex gap-8 max-[900px]:flex-col">
        {art ? (
          <AnimatedArt frames={art.frames} alt={art.alt} size={15} className="text-blue" />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <DetailHeader
            title={
              <>
                {p.name}
                {p.alias ? <span className="text-fg-dim font-normal"> ({p.alias})</span> : null}
              </>
            }
            description={p.shortSummary}
            badge={
              <span className={p.badgeTone === 'highlight' ? 'text-yellow' : 'text-fg-dim'}>
                [{p.badge}]
              </span>
            }
          />
          <MetaGrid rows={rows} />
        </div>
      </div>

      <Box title="architecture" className="flex flex-col gap-3 px-5 pt-6 pb-4">
        <Diagram text={p.diagramWide ?? p.diagram} alt={p.diagramAlt} />
      </Box>

      <Box title="highlights" className="px-5 pt-6 pb-4">
        <Bullets items={p.bullets} />
      </Box>

      <WriteUp html={writeup.html} name={p.name} />

      {wins.length > 0 ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-yellow font-bold">related</h2>
          {wins.map((a) => (
            <p key={a.id}>
              <Link href={`/leadership/achievements/${a.id}/`}>
                {a.event}: {a.award}
              </Link>
            </p>
          ))}
        </section>
      ) : null}

      <PageTrail trail={trailFor(await loadSiteTree(), `~/projects/${p.slug}`)} />
    </TerminalPage>
  );
}
