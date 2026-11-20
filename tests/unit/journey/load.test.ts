import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_JOURNEY_DIR, readJourney, toMeta } from '@/lib/journey/load';
import { FIXTURE_TODAY, fixtureEntries } from '../shell/helpers';

const temp: string[] = [];
const tempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'journey-'));
  temp.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of temp.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('journey loader', () => {
  it('validates the real entries in content/journey (a bad entry fails pnpm test)', async () => {
    await expect(readJourney(DEFAULT_JOURNEY_DIR)).resolves.toBeInstanceOf(Array);
  });

  it('treats a missing folder as no entries yet', async () => {
    await expect(readJourney(join(tempDir(), 'nope'))).resolves.toEqual([]);
  });

  it('skips the README', async () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'README.md'), '# not an entry\n');
    await expect(readJourney(dir)).resolves.toEqual([]);
  });

  it('reads the fixtures newest first, with day labels from the first entry', () => {
    expect(fixtureEntries).toHaveLength(38);
    expect(fixtureEntries[0]?.date).toBe('2026-11-19');
    expect(fixtureEntries.at(-1)).toMatchObject({ date: '2026-10-05', day: 1, slug: '2026-10-05' });
    // Oct 5 → Nov 19 is 46 days, whatever was skipped in between.
    expect(fixtureEntries[0]?.day).toBe(46);
    expect(fixtureEntries.find((e) => e.date === '2026-11-01')?.day).toBe(28);
  });

  it('renders notes with the shared Markdown pipeline, headings demoted below the entry', () => {
    const newest = fixtureEntries[0];
    expect(newest?.bodyHtml).toContain('<h3>Notes heading</h3>');
    expect(newest?.bodyHtml).toContain('<code>inline code</code>');
    expect(newest?.bodyHtml).toContain('<pre><code class="language-ts">');
    expect(fixtureEntries[1]?.bodyHtml).toBeNull();
  });

  it('strips the HTML for the tree and the shell', () => {
    const meta = toMeta(fixtureEntries[0]!);
    expect(meta).not.toHaveProperty('bodyHtml');
    expect(meta).toMatchObject({
      date: '2026-11-19',
      builtLink: 'https://example.com/fixture/newest',
    });
  });

  it('fails with the file and the field', async () => {
    const dir = tempDir();
    writeFileSync(join(dir, '2026-11-19.md'), '---\ndate: 2026-11-19\nlearned: L\nbuilt: B\n---\n');
    await expect(readJourney(dir, FIXTURE_TODAY)).rejects.toThrow(
      /2026-11-19.md: "next" is required$/,
    );
  });
});
