import { Shell } from '@/components/shell/Shell';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { PORTRAIT } from '@/content/portrait';
import { profile } from '@/content/profile';
import { neofetchRows } from '@/lib/neofetch';
import { buildSiteFs, shellInfo } from '@/lib/site-data';

export default function Home() {
  // Built here, on the server, so no content modules ship in the client bundle.
  const now = new Date();
  const fs = buildSiteFs();

  return (
    <TerminalPage fill dock={false} gap="gap-4" padBottom="pb-4">
      <Shell
        fs={fs}
        info={shellInfo}
        intro={profile.tagline}
        lastLogin={now.toDateString()}
        neofetch={{ portrait: PORTRAIT, rows: neofetchRows(now) }}
      />
    </TerminalPage>
  );
}
