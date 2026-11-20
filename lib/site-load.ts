import 'server-only';
import { loadJourneyMeta } from './journey/load';
import { buildSiteFs, shellContent } from './site-data';
import { buildSiteTree, type SiteNode } from './site-tree';
import type { VirtualFs } from './shell/types';

/**
 * The full site tree and shell filesystem, journey entries included. Server-only because the
 * journey is read from disk; `siteTree` in `site-data.ts` is the same tree without the journey.
 */
export async function loadSiteTree(): Promise<SiteNode> {
  return buildSiteTree(shellContent, await loadJourneyMeta());
}

export async function loadSiteFs(): Promise<VirtualFs> {
  return buildSiteFs(await loadJourneyMeta());
}
