import type { Metadata } from 'next';
import { NotFoundShell } from '@/components/notfound/NotFoundShell';
import { TerminalPage } from '@/components/terminal/TerminalPage';

export const metadata: Metadata = {
  title: 'page not found',
  description: 'No such page. The terminal suggests the closest one that exists.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <TerminalPage notFound>
      <NotFoundShell />
    </TerminalPage>
  );
}
