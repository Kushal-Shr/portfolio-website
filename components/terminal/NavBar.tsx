'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { activeRouteKey, ROUTES } from '@/lib/routes';
import { Clock } from './Clock';

export function NavBar() {
  const active = activeRouteKey(usePathname());

  return (
    <nav
      aria-label="Pages"
      className="bg-green text-bg flex min-h-11 w-full flex-wrap items-center gap-1 px-2.5 text-[14px] leading-none"
    >
      <span className="pr-2.5 font-bold">[kushal]</span>
      {ROUTES.map((route, index) => {
        const isActive = route.key === active;
        return (
          <Link
            key={route.key}
            href={route.href}
            aria-current={isActive ? 'page' : undefined}
            className={
              isActive
                ? 'bg-bg !text-green inline-flex min-h-11 items-center px-2.5 font-bold no-underline'
                : '!text-bg inline-flex min-h-11 items-center px-2.5 no-underline'
            }
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
