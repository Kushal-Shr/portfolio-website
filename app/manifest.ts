import type { MetadataRoute } from 'next';
import { profile } from '@/content/profile';
import { BRAND } from '@/lib/brand';
import { siteName } from '@/lib/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} · portfolio-sh`,
    short_name: profile.shortName,
    description: profile.oneLiner,
    start_url: '/',
    // A portfolio is a page to visit, not an app to install.
    display: 'browser',
    background_color: BRAND.bg,
    theme_color: BRAND.bg,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
