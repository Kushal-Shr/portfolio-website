import { loadJourney } from '@/lib/journey/load';
import { buildRss } from '@/lib/journey/rss';
import { siteUrl } from '@/lib/site';

// Prerendered at build time to `out/journey/rss.xml`: a static file, like `fs.json`.
export const dynamic = 'force-static';

export async function GET() {
  const xml = buildRss({ entries: await loadJourney(), siteUrl, now: new Date() });
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
