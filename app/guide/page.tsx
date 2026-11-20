import type { Metadata } from 'next';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'guide' };

const route = ROUTES.find((r) => r.key === 'guide');

export default function Page() {
  return (
    <TerminalPage prompt={route?.prompt ?? undefined}>
      <h1 className="text-fg-dim">guide (coming in phase 5)</h1>
    </TerminalPage>
  );
}
