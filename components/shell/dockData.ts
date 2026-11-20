import type { VirtualFs } from '@/lib/shell/types';

export type DockEngine = typeof import('@/lib/shell/dock-engine');
export type DockData = { fs: VirtualFs; engine: DockEngine };

let loading: Promise<DockData> | undefined;

/**
 * Loads the filesystem and the engine once, on first use (focus, `:` or hover). A failure is
 * not cached, so a later attempt can succeed.
 */
export function loadDock(): Promise<DockData> {
  if (!loading) {
    const version = process.env.NEXT_PUBLIC_BUILD_ID ?? '';
    loading = Promise.all([
      fetch(`/fs.json?v=${version}`).then((res) => {
        if (!res.ok) throw new Error(`fs.json: ${res.status}`);
        return res.json() as Promise<VirtualFs>;
      }),
      import('@/lib/shell/dock-engine'),
    ]).then(([fs, engine]) => ({ fs, engine }));
    loading.catch(() => {
      loading = undefined;
    });
  }
  return loading;
}
