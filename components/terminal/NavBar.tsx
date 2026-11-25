'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useDockExpanded } from '@/components/shell/useDockExpanded';
import { activeRouteKey, ROUTES } from '@/lib/routes';
import { dockUi } from '@/lib/shell/dock-ui';
import { Clock } from './Clock';

const ITEM =
  'inline-flex min-h-11 min-w-11 flex-none snap-start items-center justify-center px-2.5 no-underline';

type NavBarProps = {
  /** The page has a docked command line, so phones get the `>_` button that expands it. */
  dock?: boolean;
  /**
   * No tab is current. The 404 page is served for any URL, so the path the server rendered for
   * differs from the visitor's, and a highlighted tab would not hydrate.
   */
  noActive?: boolean;
};

/**
 * The tmux status bar. On a phone ten tabs don't fit, so the bar shows the current one and a
 * `menu` button that opens every tab as a grid above the bar (styles in globals.css). Without
 * JavaScript the button can't work, so phones fall back to tabs that scroll sideways.
 */
export function NavBar({ dock = false, noActive = false }: NavBarProps) {
  const pathname = usePathname();
  const active = noActive ? undefined : activeRouteKey(pathname);
  const expanded = useDockExpanded();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  // While open: move focus into the grid (it comes before the button in the tab order), and
  // close on a tap or focus anywhere outside the bar.
  useEffect(() => {
    const nav = ref.current;
    if (!open || !nav) return;
    const target =
      nav.querySelector<HTMLElement>('#nav-tabs [aria-current="page"]') ??
      nav.querySelector<HTMLElement>('#nav-tabs a');
    target?.focus({ preventScroll: true });
    const away = (event: Event) => {
      if (!nav.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('focusin', away);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('focusin', away);
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (open && event.key === 'Escape') {
      setOpen(false);
      menuRef.current?.focus();
    }
  };

  return (
    <nav
      ref={ref}
      aria-label="Pages"
      data-open={open ? '' : undefined}
      onKeyDown={onKeyDown}
      className="nav-bar bg-green text-bg relative flex min-h-11 w-full snap-x snap-proximity scrollbar-none items-center gap-1 overflow-x-auto text-[14px] leading-none sm:flex-wrap sm:overflow-visible"
    >
      {dock ? (
        <button
          id="dock-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="dock"
          onClick={() => {
            setOpen(false);
            dockUi.toggle();
          }}
          className={`${ITEM} cursor-pointer border-0 font-[inherit] font-bold sm:hidden ${
            expanded ? 'bg-bg !text-green' : 'bg-transparent'
          }`}
        >
          <span aria-hidden="true">&gt;_</span>
          <span className="sr-only">command line</span>
        </button>
      ) : null}
      <span className="flex-none pr-2.5 font-bold max-[359px]:hidden">[kushal]</span>
      <div id="nav-tabs" className="nav-tabs contents">
        {ROUTES.map((route, index) => {
          const isActive = route.key === active;
          return (
            <Link
              key={route.key}
              href={route.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={isActive ? `${ITEM} bg-bg !text-green font-bold` : `${ITEM} !text-bg`}
            >
              {index}:{route.label}
              {isActive ? '*' : ''}
            </Link>
          );
        })}
      </div>
      <button
        ref={menuRef}
        type="button"
        aria-expanded={open}
        aria-controls="nav-tabs"
        onClick={() => setOpen((o) => !o)}
        className={`nav-menu ${ITEM} ml-auto cursor-pointer gap-[1ch] border-0 font-[inherit] font-bold sm:hidden ${
          open ? 'bg-bg !text-green' : 'text-bg bg-transparent'
        }`}
      >
        menu<span aria-hidden="true">{open ? '▼' : '▲'}</span>
      </button>
      <Clock />
    </nav>
  );
}
