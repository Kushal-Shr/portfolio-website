import type { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { repoCount } from '@/content/github';
import { PORTRAIT } from '@/content/portrait';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { gitLogEntries } from '@/lib/dashboard';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'dashboard' };

const PAGE_KEYS = ['about', 'experience', 'leadership', 'skills', 'resume', 'journey'];

export default function DashboardPage() {
  const pages = ROUTES.filter((r) => PAGE_KEYS.includes(r.key)).map((r) => ({
    file: r.file,
    href: r.href,
  }));

  return (
    <TerminalPage padTop="compact" gap="gap-[22px]" className="text-[14px]">
      <div className="text-fg-dim flex flex-wrap justify-between gap-x-4">
        <span>
          <span className="text-green font-bold">{profile.shortName}</span>@portfolio ── v1.0
        </span>
        <span>
          {profile.location} · {profile.timezone} ·{' '}
          <span className="cursor-blink text-green">●</span>{' '}
          <span className="text-yellow">open to work: {profile.openTo.join(' · ')}</span>
        </span>
      </div>
      <Dashboard
        projects={projects}
        pages={pages}
        gitLog={gitLogEntries(achievements)}
        portrait={PORTRAIT}
        repoCount={repoCount}
        contact={{
          email: profile.email,
          github: profile.links.github,
          linkedin: profile.links.linkedin,
        }}
      />
    </TerminalPage>
  );
}
