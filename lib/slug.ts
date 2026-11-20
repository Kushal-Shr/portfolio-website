/** Names whose generic slug would be awkward. */
const OVERRIDES: Readonly<Record<string, string>> = {
  'OAuth 2.0': 'oauth2',
};

/**
 * URL slug for a skill name: lowercase, `+` becomes `p` (`C++` → `cpp`), `#` becomes `sharp`,
 * dots vanish (`Next.js` → `nextjs`) and any other run of symbols becomes `-`.
 */
export function slugify(name: string): string {
  const override = OVERRIDES[name];
  if (override) return override;
  return name
    .toLowerCase()
    .replace(/\+/g, 'p')
    .replace(/#/g, 'sharp')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
