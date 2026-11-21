import { homeCard, journeyCard, projectsCard, resumeCard } from '@/lib/og/cards';
import { renderOg } from '@/lib/og/OgFrame';
import { OG_SECTION_FILES, type OgSectionFile } from '@/lib/seo/og-image';

// Route handlers (not the `opengraph-image` file convention) so each image is written to
// `out/og/<name>.png`: a real `.png` file, which any static host serves as image/png.
export const dynamic = 'force-static';
export const dynamicParams = false;

export const generateStaticParams = () => OG_SECTION_FILES.map((name) => ({ name }));

const CARDS: Record<OgSectionFile, () => React.ReactElement> = {
  'home.png': homeCard,
  'projects.png': projectsCard,
  'journey.png': journeyCard,
  'resume.png': resumeCard,
};

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const card = CARDS[name as OgSectionFile];
  if (!card) return new Response('not found', { status: 404 });
  return renderOg(card());
}
