import { projects } from '@/content/projects';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/size';

/** Where the build writes the social images (`app/og/**`). They end in `.png` on purpose. */
export const OG_BASE = '/og';

export const OG_SECTION_FILES = ['home.png', 'projects.png', 'journey.png', 'resume.png'] as const;
export type OgSectionFile = (typeof OG_SECTION_FILES)[number];

export const projectImageFile = (slug: string): string => `${slug}.png`;

/**
 * The social image for a page. Projects get their own; the projects, journey (entries too) and
 * resume pages get their section's; everything else uses the home image.
 */
export function ogImageUrl(pagePath: string): string {
  const parts = pagePath.split('/').filter(Boolean);
  const [first, second] = parts;
  if (first === 'projects' && second && parts.length === 2) {
    return `${OG_BASE}/projects/${projectImageFile(second)}`;
  }
  if (first === 'projects') return `${OG_BASE}/projects.png`;
  if (first === 'journey') return `${OG_BASE}/journey.png`;
  if (first === 'resume') return `${OG_BASE}/resume.png`;
  return `${OG_BASE}/home.png`;
}

/** The alt text for a page's image, from the same content the image is drawn from. */
export function ogImageAlt(pagePath: string, fallback: string): string {
  const slug = pagePath.split('/').filter(Boolean)[1];
  const project = pagePath.startsWith('/projects/')
    ? projects.find((p) => p.slug === slug)
    : undefined;
  return project ? `${project.name}: ${project.shortSummary}` : fallback;
}

export const ogImageMeta = (pagePath: string, alt: string) => ({
  url: ogImageUrl(pagePath),
  width: OG_WIDTH,
  height: OG_HEIGHT,
  alt: ogImageAlt(pagePath, alt),
  type: 'image/png',
});
