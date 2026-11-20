import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { achievements } from '@/content/achievements';
import { experience } from '@/content/experience';
import { leadership } from '@/content/leadership';
import { projects } from '@/content/projects';
import { renderMarkdown } from '@/lib/markdown';
import { cleanWriteup, findOpenQuestions } from '@/lib/writeup-clean';
import { loadWriteup, parseWriteup } from '@/lib/writeups';

const root = process.cwd();
const ok = '---\nreviewed: false\nsources:\n  - a.md\n---\n';

describe('cleanWriteup', () => {
  it('strips TODO comments', () => {
    expect(cleanWriteup('## a\n\nhello <!-- TODO(kushal): ask --> world')).toBe(
      '## a\n\nhello  world',
    );
  });

  it('drops a section that is empty once comments are removed, heading included', () => {
    const out = cleanWriteup(
      '## kept\n\ntext\n\n## empty\n\n<!-- TODO(kushal): fill -->\n\n## also kept\n\nmore',
    );
    expect(out).toContain('## kept');
    expect(out).toContain('## also kept');
    expect(out).not.toContain('## empty');
  });

  it('returns an empty string when only headings would remain', () => {
    expect(cleanWriteup('## a\n\n<!-- x -->\n\n## b\n\n')).toBe('');
    expect(cleanWriteup('')).toBe('');
  });

  it('keeps text before the first heading', () => {
    expect(cleanWriteup('intro\n\n## a\n\nbody')).toBe('intro\n\n## a\n\nbody');
  });
});

describe('parseWriteup', () => {
  it('renders sanitized HTML and reports the review state', async () => {
    const w = await parseWriteup(`${ok}\n## hello\n\nsome **bold** text\n`, 'x.md');
    expect(w.html).toContain('<h2>hello</h2>');
    expect(w.html).toContain('<strong>bold</strong>');
    expect(w).toMatchObject({ reviewed: false, sources: ['a.md'] });
  });

  it('never lets a comment or a script through', async () => {
    const w = await parseWriteup(
      `${ok}\ntext <!-- TODO(kushal): secret -->\n\n<script>alert(1)</script>\n`,
      'x.md',
    );
    expect(w.html).not.toContain('secret');
    expect(w.html).not.toContain('<script');
  });

  it('hides the body of a draft', async () => {
    expect(
      (await parseWriteup('---\nreviewed: true\ndraft: true\nsources: []\n---\nbody', 'x.md')).html,
    ).toBeNull();
  });

  it('gives the placeholder when only headings remain', async () => {
    expect(
      (await parseWriteup(`${ok}\n## a\n\n<!-- TODO(kushal): x -->\n`, 'x.md')).html,
    ).toBeNull();
  });

  it('fails with the file path when the frontmatter is malformed', async () => {
    await expect(
      parseWriteup('---\nreviewed: yes please\nsources: 3\n---\nbody', 'content/projects/bad.md'),
    ).rejects.toThrow(/content\/projects\/bad\.md: invalid frontmatter/);
    await expect(
      parseWriteup('---\nsources: []\n---\nbody', 'content/x/missing-field.md'),
    ).rejects.toThrow(/content\/x\/missing-field\.md/);
    await expect(parseWriteup('---\n: : :\n  - [\n---\n', 'content/x/broken.md')).rejects.toThrow(
      /content\/x\/broken\.md/,
    );
  });
});

describe('loadWriteup', () => {
  it('treats a missing file as "no write-up yet"', async () => {
    expect(await loadWriteup('projects', 'does-not-exist')).toMatchObject({ html: null });
  });

  it('has a write-up file for every project, job, role and win', () => {
    const files: [string, string][] = [
      ...projects.map((p): [string, string] => ['projects', p.slug]),
      ...experience.map((e): [string, string] => ['experience', e.id]),
      ...leadership.map((l): [string, string] => ['leadership', l.slug]),
      ...achievements.map((a): [string, string] => ['achievements', a.id]),
    ];
    expect(files).toHaveLength(15);
    for (const [kind, slug] of files) {
      expect(existsSync(join(root, 'content', kind, `${slug}.md`)), `${kind}/${slug}.md`).toBe(
        true,
      );
    }
  });

  it('loads every real write-up without error', async () => {
    for (const kind of ['projects', 'experience', 'leadership', 'achievements'] as const) {
      for (const file of readdirSync(join(root, 'content', kind))) {
        const w = await loadWriteup(kind, file.replace(/\.md$/, ''));
        expect(w.sources.length, `${kind}/${file}`).toBeGreaterThan(0);
        if (w.html) expect(w.html).not.toContain('TODO(kushal)');
      }
    }
  });

  it('contains no phone-like number in any write-up', () => {
    for (const kind of ['projects', 'experience', 'leadership', 'achievements']) {
      for (const file of readdirSync(join(root, 'content', kind))) {
        const text = readFileSync(join(root, 'content', kind, file), 'utf8');
        expect(text, `${kind}/${file}`).not.toMatch(/\d{3}[-. ]\d{3}[-. ]\d{4}/);
      }
    }
  });
});

describe('findOpenQuestions', () => {
  it('reports each TODO(kushal) comment with its line', () => {
    const src =
      'a\n\n<!-- TODO(kushal): first\n   question -->\nb\n<!-- TODO(kushal): second -->\n';
    expect(findOpenQuestions('f.md', src)).toEqual([
      { file: 'f.md', line: 3, text: 'first question' },
      { file: 'f.md', line: 6, text: 'second' },
    ]);
  });
});

describe('renderMarkdown', () => {
  it('supports GFM tables and lists', async () => {
    const html = await renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\n\n- x\n- y\n');
    expect(html).toContain('<table>');
    expect(html).toContain('<li>x</li>');
  });
});
