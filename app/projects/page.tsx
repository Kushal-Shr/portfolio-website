import type { Metadata } from 'next';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'projects' };

const route = ROUTES.find((r) => r.key === 'projects');

export default function Page() {
  return (
    <TerminalPage prompt={route?.prompt ?? undefined}>
      <h1 className="text-fg-dim">projects (coming in phase 3)</h1>
    </TerminalPage>
  );
}
