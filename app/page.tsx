import { Shell } from '@/components/shell/Shell';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { experience } from '@/content/experience';
import { leadership } from '@/content/leadership';
import { PORTRAIT } from '@/content/portrait';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { learning, skillGroups } from '@/content/skills';
import { neofetchRows } from '@/lib/neofetch';
import { buildVirtualFs } from '@/lib/shell/fs';

export default function Home() {
  // Built here, on the server, so no content modules ship in the client bundle.
  const now = new Date();
  const fs = buildVirtualFs({
    profile,
    experience,
    projects,
    leadership,
    achievements,
    skillGroups,
    learning,
  });

  return (
    <TerminalPage fill gap="gap-4" padBottom="pb-4">
      <Shell
        fs={fs}
        info={{
          email: profile.email,
          github: profile.links.github,
          linkedin: profile.links.linkedin,
        }}
        intro={profile.tagline}
        lastLogin={now.toDateString()}
        neofetch={{ portrait: PORTRAIT, rows: neofetchRows(now) }}
      />
    </TerminalPage>
  );
}
