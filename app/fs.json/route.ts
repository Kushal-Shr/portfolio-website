import { buildSiteFs } from '@/lib/site-data';

// Exported as a static file (`out/fs.json`) so the dock can load the filesystem on demand
// instead of shipping it in every page.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(buildSiteFs());
}
