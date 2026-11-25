// Set NEXT_PUBLIC_SITE_URL in Vercel for a custom domain. Without it, a Vercel build uses the
// project's production domain (a system variable Vercel provides at build time). Only server code
// reads this, so the non-public variable is safe here.
const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelProduction ? `https://${vercelProduction}` : 'https://example.com');
export const siteName = 'Kushal Shrestha';
// TODO(kushal): set the real GitHub repository URL for this site.
export const githubRepoUrl = '';
