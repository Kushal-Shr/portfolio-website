import { describe, expect, it } from 'vitest';
import { projectArt, skillArt } from '@/content/art';
import { projects } from '@/content/projects';
import { skillGroups } from '@/content/skills';

const skillNames = skillGroups.flatMap((g) => [
  ...g.lists.flatMap((l) => l.packages),
  ...g.alsoUsed,
]);

function checkShape(art: string, maxWidth: number) {
  const lines = art.split('\n');
  expect(lines.length).toBeLessThanOrEqual(10);
  for (const line of lines) {
    expect([...line].length).toBeLessThanOrEqual(maxWidth);
    expect(line).not.toMatch(/\s$/);
    expect(line).not.toMatch(/\t/);
  }
}

describe('ASCII art', () => {
  it('has a picture with alt text for every project, and none for unknown slugs', () => {
    expect(Object.keys(projectArt).sort()).toEqual(projects.map((p) => p.slug).sort());
    for (const { art, alt } of Object.values(projectArt)) {
      checkShape(art, 56);
      expect(alt.length).toBeGreaterThan(10);
    }
  });

  it('has an icon for every skill that gets a page, and none for unknown names', () => {
    expect(Object.keys(skillArt).sort()).toEqual([...skillNames].sort());
    for (const art of Object.values(skillArt)) checkShape(art, 32);
  });
});
