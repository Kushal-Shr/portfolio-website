import type { Metadata } from 'next';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'journey' };

const route = ROUTES.find((r) => r.key === 'journey');

export default function Page() {
  return (
    <TerminalPage prompt={route?.prompt ?? undefined}>
      <h1 className="text-fg-dim">journey (coming in phase 6)</h1>
    </TerminalPage>
  );
}
