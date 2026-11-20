import { loadSiteFs } from '@/lib/site-load';

// Exported as a static file (`out/fs.json`) so the dock can load the filesystem on demand
// instead of shipping it in every page.
export const dynamic = 'force-static';

export async function GET() {
  return Response.json(await loadSiteFs());
}
