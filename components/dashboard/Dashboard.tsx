'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Bullets } from '@/components/terminal/Bullets';
import { Box } from '@/components/terminal/Box';
import { CopyButton } from '@/components/terminal/CopyButton';
import { Cursor } from '@/components/terminal/Cursor';
import { Diagram } from '@/components/terminal/Diagram';
import { Portrait } from '@/components/terminal/Portrait';
import type { Link as ContactLink, Project } from '@/content/types';
import { PHONE_QUERY } from '@/lib/hooks/useMatchMedia';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useReveal } from '@/lib/hooks/useReveal';
import { useTypewriter } from '@/lib/hooks/useTypewriter';
import type { GitLogEntry } from '@/lib/dashboard';

type DashboardProps = {
  projects: readonly Project[];
  pages: readonly { file: string; href: string }[];
  gitLog: readonly GitLogEntry[];
  portrait: readonly string[];
  repoCount: number;
  contact: { email: string; github: ContactLink; linkedin: ContactLink };
};

const subscribeHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash.slice(1);

export function Dashboard({
  projects,
  pages,
  gitLog,
  portrait,
  repoCount,
  contact,
}: DashboardProps) {
  const featured = projects.find((p) => p.featured) ?? projects[0];
  const hash = useSyncExternalStore(subscribeHash, readHash, () => '');
  const [picked, setPicked] = useState<string | null>(null);
  const selectedSlug = picked ?? (projects.some((p) => p.slug === hash) ? hash : featured?.slug);
  const selected = projects.find((p) => p.slug === selectedSlug) ?? featured;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const router = useRouter();

  const title = useTypewriter(selected?.slug ?? '', { speed: 45 });
  const reveal = useReveal(portrait.length, 45);

  if (!selected) return null;

  const select = (index: number, focus: boolean) => {
    const next = projects[Math.min(projects.length - 1, Math.max(0, index))];
    if (!next) return;
    setPicked(next.slug);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#${next.slug}`,
    );
    if (focus) buttons.current[projects.indexOf(next)]?.focus();
    // On a phone the README sits below the list, so a tap brings it into view.
    else if (window.matchMedia(PHONE_QUERY).matches) {
      document.getElementById('readme')?.scrollIntoView({
        block: 'start',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter') {
      // Enter opens the project's own page; clicking only selects.
      event.preventDefault();
      const slug = projects[index]?.slug;
      if (slug) router.push(`/projects/${slug}/`);
      return;
    }
    const target =
      event.key === 'ArrowDown'
        ? index + 1
        : event.key === 'ArrowUp'
          ? index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? projects.length - 1
              : null;
    if (target === null) return;
    event.preventDefault();
    select(target, true);
  };

  const shownPortrait = reveal.pending ? portrait : portrait.slice(0, reveal.count);
  const status = reveal.done
    ? '✓ done'
    : `rendering ${Math.round((100 * reveal.count) / portrait.length)}%`;

  return (
    // Phone: one column, in reading order (the list right above the README it controls). Tablet:
    // the left column's boxes become a row above the README and its right column. Desktop: the
    // three columns of the design. The wrappers are `display: contents` below desktop so their
    // boxes can be ordered in the one grid.
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-[22px] sm:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[280px_minmax(0,1fr)_380px]">
      <div className="contents sm:col-span-full sm:grid sm:grid-cols-3 sm:gap-[22px] lg:col-span-1 lg:flex lg:flex-col">
        <Box title="projects" variant="tui" className="order-1 px-3 pt-[18px] pb-3 sm:order-none">
          <div className="flex flex-col">
            {projects.map((p, i) => {
              const active = p.slug === selected.slug;
              return (
                <button
                  key={p.slug}
                  ref={(el) => {
                    buttons.current[i] = el;
                  }}
                  type="button"
                  aria-pressed={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(i, false)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  // Touch targets are 44px; the dense 26px rows are for a mouse on a wide screen.
                  data-dense=""
                  className={`cursor-pointer px-2 py-0.5 text-left font-[inherit] whitespace-pre max-lg:flex max-lg:min-h-11 max-lg:items-center pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center ${
                    active ? 'bg-green text-bg font-bold' : 'text-fg'
                  }`}
                >
                  {active ? '▸ ' : '  '}
                  {p.slug}/
                </button>
              );
            })}
            <a
              href={contact.github.href}
              className="text-fg-dim px-2 py-0.5 whitespace-pre max-lg:flex max-lg:min-h-11 max-lg:items-center pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center"
            >
              {'  '}github ({repoCount} repos)
            </a>
          </div>
        </Box>

        <Box title="pages" variant="tui" className="order-5 px-3 pt-[18px] pb-3 sm:order-none">
          <ul className="m-0 list-none p-0">
            {pages.map((page) => (
              <li key={page.href}>
                <a href={page.href} className="block py-0.5 max-lg:py-2.5">
                  {page.file}
                </a>
              </li>
            ))}
          </ul>
        </Box>

        <Box
          title="git log --oneline"
          variant="tui"
          className="order-6 flex-1 px-3 pt-[18px] pb-3 sm:order-none"
        >
          <pre className="max-lg:whitespace-pre-wrap">
            {gitLog.map((entry, i) => (
              <span key={entry.name}>
                {i > 0 ? '\n' : ''}
                <span className="text-yellow">* {entry.name}</span> {entry.award}
                {'\n'}
                <span className="text-fg-dim"> {entry.venue}</span>
              </span>
            ))}
          </pre>
        </Box>
      </div>

      <Box
        id="readme"
        title={`README.md — ${selected.slug}`}
        variant="tui"
        tone="green"
        className="order-2 flex min-h-0 min-w-0 scroll-mt-4 flex-col gap-[14px] px-6 pt-[22px] pb-4 sm:order-none"
      >
        <p className="-mb-2 text-right">
          <Link href={`/projects/${selected.slug}/`} className="text-fg-dim">
            cd {selected.slug} →
          </Link>
        </p>
        <h1 className="text-[20px] font-bold" aria-live="polite" aria-atomic="true">
          <span className="sr-only">{selected.slug}</span>
          <span aria-hidden="true">
            <span className="text-fg-dim"># </span>
            <span data-typing={title.pending ? 'pending' : undefined}>{title.shown}</span>
            <Cursor className="font-normal" />
          </span>
        </h1>
        <p>{selected.summary}</p>
        <p className="text-yellow">## architecture</p>
        <Diagram text={selected.diagramWide ?? selected.diagram} alt={selected.diagramAlt} />
        <p className="text-fg-dim text-[12px]">[ascii diagrams stand in for screenshots]</p>
        <p className="text-yellow">## what I did</p>
        <Bullets items={selected.bullets} className="!text-fg" />
        <p>
          {selected.links.source ? <a href={selected.links.source}>[source]</a> : null}{' '}
          {selected.links.devpost ? <a href={selected.links.devpost}>[devpost]</a> : null}
        </p>
      </Box>

      <div className="contents sm:flex sm:flex-col sm:gap-[22px]">
        <Box
          title="whoami"
          variant="tui"
          className="order-3 flex flex-col gap-2.5 px-3 pt-[18px] pb-3 sm:order-none"
        >
          <Portrait
            lines={shownPortrait}
            all={portrait}
            pending={reveal.pending}
            className="flex justify-center py-1 lg:h-[422px]"
          />
          <p className="text-fg-dim text-[12px]">
            $ jp2a me.jpg --width=72 <span className="text-green">{status}</span>
          </p>
        </Box>

        <Box
          title="contact"
          variant="tui"
          className="order-4 flex-1 px-3 pt-[18px] pb-3 sm:order-none"
        >
          <div className="grid grid-cols-[72px_1fr] gap-y-0.5">
            <span className="text-fg-dim">mail</span>
            <span className="flex flex-wrap items-baseline gap-x-2">
              <a href={`mailto:${contact.email}`} className="[overflow-wrap:anywhere]">
                {contact.email}
              </a>
              <span>
                <CopyButton value={contact.email} what="email" />
              </span>
            </span>
            <span className="text-fg-dim">gh</span>
            <a href={contact.github.href}>{contact.github.handle}</a>
            <span className="text-fg-dim">in</span>
            <a href={contact.linkedin.href}>{contact.linkedin.handle}</a>
          </div>
        </Box>
      </div>
    </div>
  );
}
