import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { siteUrl } from '@/lib/site';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  // The generated Arial-based fallback face would supply the box-drawing glyphs (wrong width);
  // with it off they fall through to ui-monospace / Menlo, which are monospaced.
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'Menlo', 'monospace'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Kushal Shrestha · portfolio-sh', template: '%s · Kushal Shrestha' },
  description: 'Terminal-themed portfolio of Kushal Shrestha.',
};

export const viewport: Viewport = {
  themeColor: '#0c0f0d',
  colorScheme: 'dark',
};

// Marks that JS is available so CSS can hide text that is about to be typed (see globals.css).
const jsFlagScript = "document.documentElement.classList.add('js')";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script adds the `js` class before React hydrates.
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
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
