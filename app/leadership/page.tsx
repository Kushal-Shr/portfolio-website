import type { Metadata } from 'next';
import { AchievementRows } from '@/components/leadership/AchievementRows';
import { RoleTable } from '@/components/leadership/RoleTable';
import { Box } from '@/components/terminal/Box';
import { MaybeTodoText } from '@/components/terminal/TodoText';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { leadership } from '@/content/leadership';
import { isTodo } from '@/content/types';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'leadership' };

const prompt = ROUTES.find((r) => r.key === 'leadership')?.prompt ?? undefined;

export default function LeadershipPage() {
  const withImpact = leadership.filter((l) => l.impact);

  return (
    <TerminalPage prompt={prompt}>
      <h1 className="sr-only">Leadership</h1>
      <RoleTable roles={leadership} />

      <div className="grid grid-cols-2 gap-[28px] pt-3">
        {withImpact.map((l) => (
          <Box
            key={l.pid}
            as="article"
            title={`cat /proc/${l.pid}/impact`}
            className="flex flex-col gap-2.5 px-[22px] pt-6 pb-[18px]"
          >
            <p className="font-bold">
              {l.role} · {l.org}
            </p>
            <p>{l.summary}</p>
            <pre className="text-fg-dim">
              {(l.impact ?? []).map((item, i) => (
                <span key={i}>
                  {i > 0 ? '\n' : ''}-{' '}
                  {isTodo(item) ? (
                    <MaybeTodoText value={item} />
                  ) : (
                    <span className="text-fg">{item}</span>
                  )}
                </span>
              ))}
            </pre>
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
