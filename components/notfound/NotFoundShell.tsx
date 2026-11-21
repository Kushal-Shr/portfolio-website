'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { loadDock } from '@/components/shell/dockData';
import { Cursor } from '@/components/terminal/Cursor';
import { ROUTES } from '@/lib/routes';
import { suggestPage } from '@/lib/shell/suggest';

/** What the static 404.html shows before the visitor's real path is known. */
const GENERIC_PATH = '/that/path';

const subscribe = () => () => {};
const readPath = () => window.location.pathname;

/** The top-level pages as `ls ~` prints them: `dashboard/`, `about.md`, … */
const TOP_LEVEL = ROUTES.filter((r) => r.key !== 'shell').map((r) => ({
  href: r.href,
  label: r.file.replace('~/', ''),
}));

export function NotFoundShell() {
  // The server renders a generic path; the browser swaps in the real one after hydration.
  const path = useSyncExternalStore(subscribe, readPath, () => GENERIC_PATH);
  const [hrefs, setHrefs] = useState<readonly string[]>([]);

  // Every page of the site comes from `fs.json`, the same file the dock loads. Reading it here
  // (and not as a prop) keeps the list out of every other page's payload.
  useEffect(() => {
    let cancelled = false;
    loadDock()
      .then(({ fs }) => {
        const routes = Object.values(fs).flatMap((node) => (node.route ? [node.route] : []));
        if (!cancelled) setHrefs([...new Set(routes)]);
      })
      .catch(() => {
        // No suggestion without the filesystem: the list of pages below still gets you out.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const guess = path === GENERIC_PATH ? undefined : suggestPage(path, hrefs);

  return (
    <>
      <h1 className="flex min-h-12 items-center text-[16px] font-normal">
        <span className="min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap">
          <span className="text-green">guest@portfolio</span>
          <span className="text-fg-dim">:</span>
          <span className="text-blue">~</span>
          <span className="text-fg-dim">$ </span>
          cd {path}
          <Cursor />
        </span>
      </h1>
      <div className="flex flex-col gap-1">
        <p data-testid="not-found-error" className="text-red [overflow-wrap:anywhere]">
          portfolio-sh: no such file or directory: {path}
        </p>
        {guess ? (
          <p className="text-fg-dim">
            did you mean: <Link href={guess}>{guess}</Link>
          </p>
        ) : (
          <p className="text-fg-dim">did you mean one of these?</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-fg-dim">
          <span className="text-green">guest@portfolio</span>:<span className="text-blue">~</span>$
          ls ~
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
          <li>
            <Link href="/" className="inline-flex min-h-11 items-center">
              ~/
            </Link>
          </li>
          {TOP_LEVEL.map((page) => (
            <li key={page.href}>
              <Link href={page.href} className="inline-flex min-h-11 items-center">
                {page.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
