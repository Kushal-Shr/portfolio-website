import type { Metadata } from 'next';
import Link from 'next/link';
import { Box } from '@/components/terminal/Box';
import { Spinner } from '@/components/skills/Spinner';
import { SkillsFilter } from '@/components/skills/SkillsFilter';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { learning, skillGroups } from '@/content/skills';
import { skillCounts } from '@/lib/skills';
import { slugify } from '@/lib/slug';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'skills' };

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
        title="currently installing"
        tone="yellow"
        className="flex flex-col gap-1.5 px-5 pt-6 pb-4"
      >
        {learning.map((item) => (
          <p key={item.name}>
            <Spinner /> Setting up <span className="font-bold">{item.name}</span>
            <span className="text-fg-dim"> … {item.note}</span>
          </p>
        ))}
        <p className="text-fg-dim pt-1.5 text-[13px]">
          progress gets logged daily in <Link href="/journey/">~/journey</Link>
        </p>
      </Box>
    </TerminalPage>
  );
}
