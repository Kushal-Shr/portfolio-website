import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimatedArt } from '@/components/terminal/AnimatedArt';
import { Box } from '@/components/terminal/Box';
import { Spinner } from '@/components/skills/Spinner';
import { SkillsFilter } from '@/components/skills/SkillsFilter';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { groupArt } from '@/content/art';
import { now } from '@/content/experience';
import { projects } from '@/content/projects';
import { skillGroups } from '@/content/skills';
import { skillCounts } from '@/lib/skills';
import { slugify } from '@/lib/slug';
import { ROUTES } from '@/lib/routes';
import { routeDescriptions } from '@/lib/seo/copy';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'skills',
  description: routeDescriptions.skills,
  path: '/skills/',
});

const prompt = ROUTES.find((r) => r.key === 'skills')?.prompt ?? undefined;

export default function SkillsPage() {
  return (
    <TerminalPage prompt={prompt}>
      <h1 className="sr-only">Skills</h1>
      <SkillsFilter counts={skillCounts(skillGroups)} />

      <div className="grid grid-cols-1 items-start gap-7 pt-2 sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group) => (
          <Box
            key={group.key}
            section={group.key}
            title={group.title}
            className="flex flex-col gap-1.5 px-5 pt-6 pb-4"
          >
            <div className="border-line mb-2 flex justify-center border px-2 py-3">
              <AnimatedArt
                frames={groupArt[group.key].frames}
                alt={groupArt[group.key].alt}
                size={12}
                className="text-green"
              />
            </div>
            {group.lists
              .flatMap((list) => list.packages)
              .map((name) => (
                <p key={name}>
                  <span className="font-bold">
                    <Link href={`/skills/${slugify(name)}/`} className="link-quiet">
                      {name}
                    </Link>
                  </span>
                  <span className="text-fg-dim">/stable</span>{' '}
                  <span className="text-fg-dim">[installed]</span>
                </p>
              ))}
            <p className="text-fg-dim pt-1.5 text-[13px]">also used: {group.alsoUsed.join(', ')}</p>
          </Box>
        ))}
      </div>

      <Box
        title="currently building"
        tone="yellow"
        className="flex flex-col gap-1.5 px-5 pt-6 pb-4"
      >
        {now.building.map((item) => {
          const p = projects.find((x) => x.slug === item.project);
          return p ? (
            <p key={item.project}>
              <Spinner /> Building{' '}
              <Link href={`/projects/${p.slug}/`} className="link-quiet font-bold">
                {p.name}
              </Link>
              <span className="text-fg-dim"> … {item.note}</span>
            </p>
          ) : null;
        })}
        <p className="text-fg-dim pt-1.5 text-[13px]">
          progress gets logged daily in <Link href="/journey/">~/journey</Link>
        </p>
      </Box>
    </TerminalPage>
  );
}
