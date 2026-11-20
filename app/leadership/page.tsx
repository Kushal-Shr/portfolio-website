import type { Metadata } from 'next';
import { AchievementRows } from '@/components/leadership/AchievementRows';
import { RoleTable } from '@/components/leadership/RoleTable';
import { Box } from '@/components/terminal/Box';
import { HangingList } from '@/components/terminal/HangingList';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { leadership } from '@/content/leadership';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'leadership' };

const prompt = ROUTES.find((r) => r.key === 'leadership')?.prompt ?? undefined;

export default function LeadershipPage() {
  const withImpact = leadership.filter((l) => l.impact);

  return (
    <TerminalPage prompt={prompt}>
      <h1 className="sr-only">Leadership</h1>
      <RoleTable roles={leadership} />

      <div className="grid grid-cols-1 gap-[28px] pt-3 min-[900px]:grid-cols-2">
        {withImpact.map((l) => (
          <Box
            key={l.pid}
            as="article"
            title={`cat /proc/${l.pid}/impact`}
            className="flex min-w-0 flex-col gap-2.5 px-[22px] pt-6 pb-[18px]"
          >
            <p className="font-bold">
              {l.role} · {l.org}
            </p>
            <p>{l.summary}</p>
            <HangingList items={l.impact ?? []} tone="dim" />
          </Box>
        ))}

        <Box
          title="ls ~/achievements"
          titleHref="/leadership/achievements/"
          tone="yellow"
          className="col-span-full flex flex-col gap-2.5 px-[22px] pt-6 pb-[18px]"
        >
          <AchievementRows achievements={achievements} />
        </Box>
      </div>
    </TerminalPage>
  );
}
