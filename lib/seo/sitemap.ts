import type { MetadataRoute } from 'next';
import { flatten, type SiteNode } from '@/lib/site-tree';

const JOURNEY_PAGE = /^\/journey\/(\d{4}-\d{2}-\d{2})\/$/;

/** One sitemap entry for every page in the site tree: detail pages and journey permalinks too. */
export function sitemapEntries(
  tree: SiteNode,
  siteUrl: string,
  built: Date,
): MetadataRoute.Sitemap {
  const origin = siteUrl.replace(/\/$/, '');
  return flatten(tree)
    .filter((node): node is SiteNode & { href: string } => Boolean(node.href))
    .map((node) => {
      const day = JOURNEY_PAGE.exec(node.href)?.[1];
      return {
        url: `${origin}${node.href}`,
        // A journey entry never changes after its day; everything else changes with a build.
        lastModified: day ? new Date(`${day}T00:00:00Z`) : built,
      };
    });
}
