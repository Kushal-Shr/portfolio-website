import type { Metadata } from 'next';
import { PageTrail } from '@/components/detail/PageTrail';
import { WriteUp } from '@/components/detail/WriteUp';
import { RoleTable } from '@/components/leadership/RoleTable';
import { Box } from '@/components/terminal/Box';
import { MaybeTodoText } from '@/components/terminal/TodoText';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { leadership } from '@/content/leadership';
import { isTodo } from '@/content/types';
import { trailFor } from '@/lib/detail';
import { siteTree } from '@/lib/site-data';
import { loadWriteup } from '@/lib/writeups';

export const dynamicParams = false;

export const generateStaticParams = () => leadership.map((l) => ({ slug: l.slug }));

type Props = { params: Promise<{ slug: string }> };

const find = async (params: Props['params']) => {
  const { slug } = await params;
  const role = leadership.find((l) => l.slug === slug);
  if (!role) throw new Error(`unknown role: ${slug}`);
  return role;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await find(params);
  return { title: `${l.role} · ${l.org}`, description: l.summary ?? `${l.role}, ${l.org}` };
}

export default async function RolePage({ params }: Props) {
  const l = await find(params);
  const writeup = await loadWriteup('leadership', l.slug);

  return (
    <TerminalPage prompt={`ps -fp ${l.pid}`} promptPath={`~/leadership/${l.slug}`}>
      <RoleTable roles={[l]} linkRoles={false} />
      <div className="flex flex-col gap-2">
        <h1 className="text-[20px] font-bold">
          {l.role} · {l.org}
        </h1>
        {l.summary ? <p>{l.summary}</p> : null}
      </div>

      {l.impact ? (
        <Box title="impact" className="px-5 pt-6 pb-4">
          <pre className="text-fg-dim">
            {l.impact.map((item, i) => (
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
      ) : null}

      <WriteUp html={writeup.html} name={`${l.role} · ${l.org}`} />

      <PageTrail trail={trailFor(siteTree, `~/leadership/${l.slug}`)} />
    </TerminalPage>
  );
}
