import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { profile } from '@/content/profile';
import { BRAND } from '@/lib/brand';
import { RSS_PATH } from '@/lib/journey/format';
import { RSS_TITLE } from '@/lib/journey/rss';
import { defaultTitle, siteDescription } from '@/lib/seo/copy';
import { ogImageMeta } from '@/lib/seo/og-image';
import { siteName, siteUrl } from '@/lib/site';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  // No generated fallback face, and no fallback list of its own: the Arial-based face would supply
  // the box-drawing glyphs at the wrong width, and the system fonts must come after the symbols
  // font below (see `--font-mono` in globals.css).
  adjustFontFallback: false,
  fallback: [],
  variable: '--font-jetbrains-mono',
});

// Google's `latin` subset has no box-drawing, block or arrow glyphs, so every diagram and box title
// would fall back to whatever monospace the visitor has, with its own metrics: gaps between rows in
// Safari, a different width elsewhere. This is the same font, cut to just those glyphs
// (`text=` on the Google Fonts CSS API, OFL licence alongside), so the art draws the same everywhere.
const jetbrainsMonoSymbols = localFont({
  src: [
    { path: './fonts/jetbrains-mono-symbols-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/jetbrains-mono-symbols-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
  variable: '--font-jetbrains-mono-symbols',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: `%s · ${siteName}` },
  description: siteDescription,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  keywords: [
    profile.name,
    'portfolio',
    'data engineering',
    'machine learning',
    'full-stack',
    profile.education.school,
  ],
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': [{ url: RSS_PATH, title: RSS_TITLE }] },
  },
  openGraph: {
    type: 'website',
    siteName,
    locale: 'en_US',
    url: '/',
    title: defaultTitle,
    description: siteDescription,
    images: [ogImageMeta('/', defaultTitle)],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: siteDescription,
    images: [{ url: ogImageMeta('/', defaultTitle).url }],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: BRAND.bg,
  colorScheme: 'dark',
  // Draw under the notch and home bar: the nav pads itself with the safe-area insets.
  viewportFit: 'cover',
};

// Marks that JS is available so CSS can hide text that is about to be typed (see globals.css).
const jsFlagScript = "document.documentElement.classList.add('js')";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script adds the `js` class before React hydrates.
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${jetbrainsMonoSymbols.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlagScript }} />
      </head>
      <body>
        <a href="#content" className="skip-link">
          skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
