import { projectCard } from '@/lib/og/cards';
import { renderOg } from '@/lib/og/OgFrame';
import { projects } from '@/content/projects';
import { projectImageFile } from '@/lib/seo/og-image';

export const dynamic = 'force-static';
export const dynamicParams = false;

export const generateStaticParams = () => projects.map((p) => ({ file: projectImageFile(p.slug) }));

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const project = projects.find((p) => projectImageFile(p.slug) === file);
  if (!project) return new Response('not found', { status: 404 });
  return renderOg(projectCard(project.slug));
}
