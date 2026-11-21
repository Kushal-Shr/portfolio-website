import type { Metadata } from 'next';
import { RSS_PATH } from '@/lib/journey/format';
import { RSS_TITLE } from '@/lib/journey/rss';
import { siteName } from '@/lib/site';
import { ogImageMeta } from './og-image';

/** Pages replace (not merge) the layout's `alternates`, so every page carries the feed too. */
const FEED = { 'application/rss+xml': [{ url: RSS_PATH, title: RSS_TITLE }] };

export type PageMeta = {
  title: string;
  description: string;
  /** The page's own path (`/projects/zenith/`): the canonical URL and the `og:url`. */
  path: string;
  keywords?: readonly string[];
  /** Skips the `%s · Kushal Shrestha` template (the home page). */
  absoluteTitle?: boolean;
  article?: { publishedTime: string; tags?: readonly string[] };
  noindex?: boolean;
};

/**
 * Metadata for one page. The Open Graph and Twitter blocks are spelled out in full because a page's
 * `openGraph` replaces the layout's instead of merging with it. Images come from the
 * `opengraph-image` files and are added by Next.
 */
export function pageMetadata(meta: PageMeta): Metadata {
  const social = meta.absoluteTitle ? meta.title : `${meta.title} · ${siteName}`;
  const image = ogImageMeta(meta.path, social);
  return {
    title: meta.absoluteTitle ? { absolute: meta.title } : meta.title,
    description: meta.description,
    ...(meta.keywords?.length ? { keywords: [...meta.keywords] } : {}),
    alternates: { canonical: meta.path, types: FEED },
    openGraph: {
      type: meta.article ? 'article' : 'website',
      siteName,
      locale: 'en_US',
      url: meta.path,
      title: social,
      description: meta.description,
      images: [image],
      ...(meta.article
        ? { publishedTime: meta.article.publishedTime, tags: [...(meta.article.tags ?? [])] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: social,
      description: meta.description,
      images: [{ url: image.url, alt: image.alt, width: image.width, height: image.height }],
    },
    ...(meta.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
