import type { Metadata } from 'next';
import Link from 'next/link';
import { Bullets } from '@/components/terminal/Bullets';
import { Box } from '@/components/terminal/Box';
import { Diagram } from '@/components/terminal/Diagram';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { repoCount } from '@/content/github';
import { extraProjects, projects } from '@/content/projects';
import { profile } from '@/content/profile';
import type { Project } from '@/content/types';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'projects' };

const prompt = ROUTES.find((r) => r.key === 'projects')?.prompt ?? undefined;
const CARD = 'flex flex-col gap-3 px-[22px] pt-6 pb-[18px]';

function Links({ project }: { project: Project }) {
  const entries = [
    ['source', project.links.source],
    ['devpost', project.links.devpost],
  ] as const;
  return (
    <p>
      {entries.map(([label, href]) =>
        href ? (
          <span key={label}>
            <a href={href}>[{label}]</a>{' '}
          </span>
        ) : null,
      )}
    </p>
  );
}

function Card({ project }: { project: Project }) {
  const diagram = project.featured ? (project.diagramWide ?? project.diagram) : project.diagram;
  const text = (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-yellow">{project.tags.map((t) => `[${t}]`).join(' ')}</p>
      <p>{project.summary}</p>
      {project.featured ? null : (
        <Diagram text={diagram} alt={project.diagramAlt} className="text-[13px] leading-[1.35]" />
      )}
      <Bullets items={project.bullets} />
      <Links project={project} />
    </div>
  );

  return (
    <Box
      as="article"
      id={project.slug}
      title={`${project.slug}/`}
      tone={project.featured ? 'green' : 'default'}
      badge={
        <p className={project.badgeTone === 'highlight' ? 'text-yellow' : 'text-fg-dim'}>
          [{project.badge}]
        </p>
      }
      className={`${CARD} ${project.featured ? 'col-span-full' : ''} scroll-mt-6`}
    >
      {project.featured ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-8">
          {text}
          <Diagram text={diagram} alt={project.diagramAlt} className="text-[13px] leading-[1.35]" />
        </div>
      ) : (
        text
      )}
    </Box>
  );
}

export default function ProjectsPage() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <TerminalPage prompt={prompt}>
      <h1 className="sr-only">Projects</h1>
      <div className="grid grid-cols-2 gap-x-[28px] gap-y-[32px] pt-2">
        {[...featured, ...rest].map((p) => (
          <Card key={p.slug} project={p} />
        ))}
      </div>
      <p className="text-fg-dim">
        {projects.length} projects · also:{' '}
        {extraProjects.map((extra) => {
          const a = achievements.find((x) => x.id === extra.achievementId);
          return (
            <span key={extra.name}>
              {extra.name} ({extra.stack.join(', ')}){a ? `, ${a.event} ${a.award}` : ''}
              {a?.link ? (
                <>
                  {' '}
                  <a href={a.link}>[devpost]</a>
                </>
              ) : null}
            </span>
          );
        })}{' '}
        · <a href={profile.links.github.href}>{profile.links.github.label}</a> has {repoCount} repos
        · <Link href="/">cd ~</Link>
      </p>
    </TerminalPage>
  );
}
