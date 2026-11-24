import { describe, expect, it } from 'vitest';
import { groupArt, projectArt, skillArt } from '@/content/art';
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
    expect(line).not.toMatch(/\t/);
  }
}

/** Every frame is the same block of text, so the picture never changes size while it plays. */
function checkFrames(frames: readonly string[], maxWidth: number) {
  expect(frames.length).toBeGreaterThan(2);
  expect(new Set(frames).size).toBeGreaterThan(2);
  const shape = (f: string) => f.split('\n').map((l) => [...l].length);
  for (const frame of frames) {
    checkShape(frame, maxWidth);
    expect(shape(frame)).toEqual(shape(frames[0] ?? ''));
  }
  expect(new Set(shape(frames[0] ?? '')).size).toBe(1);
}

describe('ASCII art', () => {
  it('has an animated picture with alt text for every project, and none for unknown slugs', () => {
    expect(Object.keys(projectArt).sort()).toEqual(projects.map((p) => p.slug).sort());
    for (const { art, alt, frames } of Object.values(projectArt)) {
      checkFrames(frames, 56);
      // The finished picture closes every loop, and it is what no-JS visitors see.
      expect(frames.at(-1)).toBe(art);
      expect(alt.length).toBeGreaterThan(10);
    }
  });

  it('has an animated picture for each skills box', () => {
    expect(Object.keys(groupArt).sort()).toEqual(skillGroups.map((g) => g.key).sort());
    for (const { alt, frames } of Object.values(groupArt)) {
      checkFrames(frames, 32);
      expect(alt.length).toBeGreaterThan(10);
    }
  });

  it('has an icon for every skill that gets a page, and none for unknown names', () => {
    expect(Object.keys(skillArt).sort()).toEqual([...skillNames].sort());
    for (const art of Object.values(skillArt)) {
      checkShape(art, 32);
      for (const line of art.split('\n')) expect(line).not.toMatch(/\s$/);
    }
  });
});
