'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cwdForRoute, cwdFromPathname } from '@/lib/shell/route';
import { shellStore } from '@/lib/shell/store';
import type { VirtualFs } from '@/lib/shell/types';
import { useShellState } from './useShellState';

/**
 * Wires the shared session to the router: a navigation the engine returned is performed here,
 * and the working directory follows the URL (nav clicks, links, back/forward included).
 */
export function useShellNavigation(fs: VirtualFs | undefined): void {
  const router = useRouter();
  const pathname = usePathname();
  const { pendingNavigation } = useShellState();

  useEffect(() => {
    if (!pendingNavigation) return;
    const replace = shellStore.consumeReplace();
    shellStore.dispatch({ type: 'navigated' });
    shellStore.markShellNavigation();
    const [path = '/'] = pendingNavigation.split('?');
    // `cd` to the page you're already on has nowhere to go.
    if (path === pathname && !pendingNavigation.includes('?')) return;
    if (replace) router.replace(pendingNavigation);
    else router.push(pendingNavigation);
  }, [pendingNavigation, pathname, router]);

  useEffect(() => {
    // The filesystem is authoritative; before it has loaded the URL's own shape is enough.
    const cwd = fs ? cwdForRoute(fs, pathname) : cwdFromPathname(pathname);
    if (cwd) shellStore.dispatch({ type: 'sync-cwd', cwd });
  }, [fs, pathname]);
}
