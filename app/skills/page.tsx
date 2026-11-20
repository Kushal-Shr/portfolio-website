import type { Metadata } from 'next';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'skills' };

const route = ROUTES.find((r) => r.key === 'skills');

export default function Page() {
  return (
    <TerminalPage prompt={route?.prompt ?? undefined}>
      <h1 className="text-fg-dim">skills (coming in phase 5)</h1>
    </TerminalPage>
  );
}
