import type { MetadataRoute } from 'next';
import { profile } from '@/content/profile';
import { siteName } from '@/lib/site';

export const dynamic = 'force-static';

// Same values as the `bg` token in globals.css; a manifest cannot read CSS.
const BG = '#0c0f0d';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} · portfolio-sh`,
    short_name: profile.shortName,
    description: profile.oneLiner,
    start_url: '/',
    // A portfolio is a page to visit, not an app to install.
    display: 'browser',
    background_color: BG,
    theme_color: BG,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
