import type { Metadata } from 'next';
import Link from 'next/link';
import { CopyButton } from '@/components/terminal/CopyButton';
import { JsonLd } from '@/components/seo/JsonLd';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { experience } from '@/content/experience';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { skillGroups } from '@/content/skills';
import { formatMonthYear, formatRange, openToSentence } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import { routeDescriptions } from '@/lib/seo/copy';
import { personJsonLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'about',
  description: routeDescriptions.about,
  path: '/about/',
});

const prompt = ROUTES.find((r) => r.key === 'about')?.prompt ?? undefined;
const manName = `${profile.shortName.toUpperCase()}(${profile.manPage.section})`;

function Section({
  title,
  gap = 'gap-1',
  children,
}: {
  title: string;
  gap?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex flex-col ${gap}`}>
      <h2 className="text-fg-bright font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  const buildDate = formatMonthYear(new Date());

  return (
    <TerminalPage prompt={prompt} padX="wide" gap="gap-[26px]" className="leading-[1.7]">
      <JsonLd data={personJsonLd()} />
      <h1 className="sr-only">{profile.name}: about</h1>
      <div className="text-fg-dim flex justify-between">
        <span>{manName}</span>
        <span className="max-sm:hidden">{profile.manPage.title}</span>
        <span>{manName}</span>
      </div>

      <Section title="NAME">
        <p className="pl-[2ch] sm:pl-[7ch]">
          <span className="font-bold">{profile.shortName}</span> — {profile.oneLiner}
        </p>
      </Section>

      <Section title="SYNOPSIS">
        <p className="pl-[2ch] sm:pl-[7ch]">
          <span className="font-bold">{profile.shortName}</span>{' '}
          {profile.synopsisFlags.map((flag) => (
            <span key={flag}>
              [<span className="underline">--{flag}</span>]{' '}
            </span>
          ))}
          <span className="underline">problem</span>
        </p>
      </Section>

      <Section title="DESCRIPTION">
        {profile.about.paragraphs.map((text) => (
          <p key={text} className="max-w-[72ch] pl-[2ch] sm:pl-[7ch]">
            {text}
          </p>
        ))}
      </Section>

      <Section title="EXPERIENCE" gap="gap-2.5">
        <div className="flex flex-col gap-3 pl-[2ch] sm:pl-[7ch]">
          {experience.map((e) => (
            <div key={e.id}>
              <p className="flex justify-between gap-x-4 max-sm:flex-col">
                <span>
                  <Link href={`/experience/${e.id}/`} className="link-quiet inline-block min-h-6">
                    <span className="font-bold">{e.orgShort ?? e.org}</span>, {e.title}
                  </Link>
                </span>
                <span className="text-fg-dim">{formatRange(e.start, e.end, 'years')}</span>
              </p>
              <p className="pl-[2ch] sm:pl-[7ch]">{e.summary}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="PROJECTS" gap="gap-2.5">
        <div className="grid grid-cols-1 gap-y-2 pl-[2ch] sm:grid-cols-[22ch_minmax(0,1fr)] sm:pl-[7ch]">
          {projects.map((p) => (
            <div key={p.slug} className="contents">
              <Link href={`/projects/${p.slug}/`} className="link-quiet font-bold">
                {p.slug}
              </Link>
              <span className="max-sm:mb-1 max-sm:pl-[2ch]">{p.shortSummary}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="OPTIONS" gap="gap-2.5">
        <div className="grid grid-cols-1 gap-y-1 pl-[2ch] sm:grid-cols-[22ch_minmax(0,1fr)] sm:pl-[7ch]">
          {skillGroups
            .flatMap((g) => g.lists)
            .map((list) => (
              <div key={list.key} className="contents">
                <span className="font-bold">
                  -{list.flag}, --{list.key}
                </span>
                <span className="max-sm:mb-1 max-sm:pl-[2ch]">{list.packages.join(', ')}</span>
              </div>
            ))}
        </div>
      </Section>

      <Section title="EXIT STATUS">
        <p className="pl-[2ch] whitespace-pre-wrap sm:pl-[7ch]">
          <span className="font-bold">0</span>
          {'      '}Open to roles in {openToSentence(profile.openTo)}.
        </p>
      </Section>

      <Section title="SEE ALSO">
        <p className="pl-[2ch] sm:pl-[7ch]">
          <a href={`mailto:${profile.email}`}>email(1)</a>{' '}
          <CopyButton value={profile.email} what="email" />,{' '}
          <a href={profile.links.github.href}>github(1)</a>,{' '}
          <a href={profile.links.linkedin.href}>linkedin(1)</a>,{' '}
          <Link href="/resume/">resume(7)</Link>
        </p>
      </Section>

      <div className="text-fg-dim mt-auto flex justify-between">
        <span>{profile.location}</span>
        <span data-testid="build-date">{buildDate}</span>
        <span>{profile.manPage.section}</span>
      </div>
    </TerminalPage>
  );
}
