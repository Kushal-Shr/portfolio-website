import { skillGroups } from '@/content/skills';
import { profile } from '@/content/profile';
import { siteUrl } from '@/lib/site';

/**
 * schema.org `Person`. Honest about being a student, and deliberately without a `telephone`: the
 * phone number lives only inside the resume PDF.
 */
export function personJsonLd() {
  const city = profile.location.split(',');
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: siteUrl,
    jobTitle: 'Computer Science student',
    description: profile.oneLiner,
    email: `mailto:${profile.email}`,
    affiliation: { '@type': 'CollegeOrUniversity', name: profile.education.school },
    address: {
      '@type': 'PostalAddress',
      addressLocality: city[0]?.trim(),
      addressRegion: city[1]?.trim(),
      addressCountry: 'US',
    },
    sameAs: [profile.links.github.href, profile.links.linkedin.href],
    knowsAbout: skillGroups.flatMap((g) => g.lists.flatMap((l) => l.packages)),
  };
}

/** JSON for a `<script type="application/ld+json">`: `<` is escaped so no value can close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
