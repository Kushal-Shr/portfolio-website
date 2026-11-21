import type { MetadataRoute } from 'next';
import { sitemapEntries } from '@/lib/seo/sitemap';
import { siteUrl } from '@/lib/site';
import { loadSiteTree } from '@/lib/site-load';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(await loadSiteTree(), siteUrl, new Date());
}
