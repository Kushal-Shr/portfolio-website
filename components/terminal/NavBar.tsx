'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDockExpanded } from '@/components/shell/useDockExpanded';
import { useScrollFade } from '@/lib/hooks/useScrollFade';
import { activeRouteKey, ROUTES } from '@/lib/routes';
import { dockUi } from '@/lib/shell/dock-ui';
import { Clock } from './Clock';

const ITEM =
  'inline-flex min-h-11 min-w-11 flex-none snap-start items-center justify-center px-2.5 no-underline';

type NavBarProps = {
  /** The page has a docked command line, so phones get the `>_` button that expands it. */
  dock?: boolean;
};

export function NavBar({ dock = false }: NavBarProps) {
  const active = activeRouteKey(usePathname());
  const expanded = useDockExpanded();
  const ref = useRef<HTMLElement>(null);
  useScrollFade(ref);

  // On a phone the tabs scroll sideways: bring the current page's tab to the middle.
  useEffect(() => {
    const nav = ref.current;
    const tab = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !tab || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2;
  }, [active]);

  return (
    <nav
      ref={ref}
      aria-label="Pages"
      className="nav-bar bg-green text-bg relative flex min-h-11 w-full snap-x snap-proximity scrollbar-none items-center gap-1 overflow-x-auto text-[14px] leading-none sm:flex-wrap sm:overflow-visible"
    >
      {dock ? (
        <button
          id="dock-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="dock"
          onClick={dockUi.toggle}
          className={`${ITEM} cursor-pointer border-0 font-[inherit] font-bold sm:hidden ${
            expanded ? 'bg-bg !text-green' : 'bg-transparent'
          }`}
        >
          <span aria-hidden="true">&gt;_</span>
          <span className="sr-only">command line</span>
        </button>
      ) : null}
      <span className="flex-none pr-2.5 font-bold">[kushal]</span>
      {ROUTES.map((route, index) => {
        const isActive = route.key === active;
        return (
          <Link
            key={route.key}
            href={route.href}
            aria-current={isActive ? 'page' : undefined}
            className={isActive ? `${ITEM} bg-bg !text-green font-bold` : `${ITEM} !text-bg`}
          >
            {index}:{route.label}
            {isActive ? '*' : ''}
          </Link>
        );
      })}
      <Clock />
    </nav>
  );
}
