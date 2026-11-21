import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { Shell } from '@/components/shell/Shell';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { PORTRAIT } from '@/content/portrait';
import { profile } from '@/content/profile';
import { neofetchRows } from '@/lib/neofetch';
import { defaultTitle, siteDescription } from '@/lib/seo/copy';
import { personJsonLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/metadata';
import { shellInfo } from '@/lib/site-data';
import { loadSiteFs } from '@/lib/site-load';

export const metadata: Metadata = pageMetadata({
  title: defaultTitle,
  absoluteTitle: true,
  description: siteDescription,
  path: '/',
});

export default async function Home() {
  // Built here, on the server, so no content modules ship in the client bundle.
  const now = new Date();
  const fs = await loadSiteFs();

  return (
    <TerminalPage fill dock={false} gap="gap-4" padBottom="pb-4">
      <JsonLd data={personJsonLd()} />
      <Shell
        fs={fs}
        info={shellInfo}
        intro={profile.tagline}
        lastLogin={now.toDateString()}
        neofetch={{ portrait: PORTRAIT, rows: neofetchRows(now) }}
      />
    </TerminalPage>
  );
}
