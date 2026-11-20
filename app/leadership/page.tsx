import type { Metadata } from 'next';
import { Box } from '@/components/terminal/Box';
import { MaybeTodoText } from '@/components/terminal/TodoText';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { leadership } from '@/content/leadership';
import { isTodo } from '@/content/types';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'leadership' };

const prompt = ROUTES.find((r) => r.key === 'leadership')?.prompt ?? undefined;
const COLUMNS = ['PID', 'ROLE', 'ORG', 'SCOPE', 'STAT', 'STATUS'];

export default function LeadershipPage() {
  const withImpact = leadership.filter((l) => l.impact);

  return (
    <TerminalPage prompt={prompt}>
      <h1 className="sr-only">Leadership</h1>
      <table className="w-full border-collapse">
        <caption className="text-fg-dim pb-2 text-left">
          ps aux --leadership · roles I&apos;ve taken on outside my day job
        </caption>
        <thead>
          <tr className="bg-green">
            {COLUMNS.map((col, i) => (
              <th
                key={col}
                scope="col"
                className={`text-bg py-1.5 pr-4 text-left font-bold ${i === 0 ? 'pl-2.5' : 'pl-0'}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leadership.map((l) => (
            <tr key={l.pid} className="border-line border-b">
              <td className="text-fg-dim py-2 pr-4 pl-2.5">{l.pid}</td>
              <td className="py-2 pr-4 align-top">
                <span className="font-bold">{l.role}</span>
              </td>
              <td className="py-2 pr-4 align-top">{l.org}</td>
              <td className="py-2 pr-4 align-top">{l.scope}</td>
              <td className="py-2 pr-4 align-top">{l.stat}</td>
              <td className="py-2 pr-4 align-top">
                <span className={l.status.tone === 'running' ? 'text-green' : 'text-fg-dim'}>
                  {l.status.text}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
          tone="yellow"
          className="col-span-full flex flex-col gap-2.5 px-[22px] pt-6 pb-[18px]"
        >
          <div className="grid grid-cols-[22ch_34ch_minmax(0,1fr)] gap-y-[6px]">
            {achievements.map((a) => {
              const detail =
                a.inlineVenue && a.location ? `${a.description}, ${a.location}` : a.description;
              return (
                <div key={a.id} className="contents">
                  <span className="font-bold">{a.event}</span>
                  <span className="text-yellow">{a.award}</span>
                  <span>
                    {/[.]$/.test(detail) ? detail : `${detail}.`}
                    {a.link ? (
                      <>
                        {' '}
                        <a href={a.link}>[devpost]</a>
                      </>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </Box>
      </div>
    </TerminalPage>
  );
}
