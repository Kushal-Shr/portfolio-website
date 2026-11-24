import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { achievements, experience, leadership, profile, projects, skillGroups } from '@/content';
import { formatRange } from '@/lib/format';
import { lineText, renderResume, RESUME_WIDTH } from '@/lib/resume';
import { hasDesign } from './design-files';

const content = { profile, experience, projects, leadership, achievements, skillGroups };
const lines = renderResume(content);
const ours = lines.map(lineText);

describe('renderResume', () => {
  it(`never renders a line wider than ${RESUME_WIDTH} columns`, () => {
    expect(Math.max(...ours.map((l) => [...l].length))).toBeLessThanOrEqual(RESUME_WIDTH);
  });

  it('follows the PDF’s section order', () => {
    const headings = lines.filter((l) => l[0]?.tone === 'heading').map(lineText);
    expect(headings).toEqual([
      'EDUCATION',
      'EXPERIENCE',
      'PROJECTS',
      'LEADERSHIP & ACHIEVEMENTS',
      'TECHNICAL SKILLS',
      'COMPETITIONS',
    ]);
  });

  it('right-aligns each job’s dates, spelled out as in the PDF', () => {
    for (const e of experience) {
      const range = formatRange(e.start, e.end, 'long');
      const line = ours.find((l) => l.endsWith(range));
      expect(line, range).toBeDefined();
      expect([...(line ?? '')]).toHaveLength(RESUME_WIDTH);
    }
    expect(ours).toContain(
      `Data Engineering Intern - Year Round${' '.repeat(RESUME_WIDTH - 61)}May 2025 - September 2026`,
    );
  });

  it('lists only the PDF’s three projects, with their source links', () => {
    const titles = ours.filter((l) => / \| Source Code$/.test(l));
    expect(titles.map((l) => l.split(' | ')[0])).toEqual([
      'Rant & Heal',
      'Zenith — Ghost Visualizer',
      'SurgiPath',
    ]);
    const links = lines.flat().filter((s) => s.text === 'Source Code');
    expect(links.map((s) => s.href)).toEqual(
      projects.filter((p) => p.onResume).map((p) => p.links.source),
    );
  });

  it('never contains a phone-like number', () => {
    expect(ours.join('\n')).not.toMatch(/\d{3}[-. ]\d{3}[-. ]\d{4}/);
  });

  it.skipIf(!hasDesign)('carries every bullet of the PDF word for word, one per line', () => {
    const transcript = readFileSync(join(process.cwd(), 'design/source/resume.md'), 'utf8');
    const bullets = transcript
      .split('\n')
      .filter((l) => /^ *- /.test(l) && !l.includes('**'))
      .map((l) => l.replace(/^ *- /, ''));
    expect(bullets.length).toBeGreaterThan(15);
    for (const b of bullets) expect(ours).toContain(`  • ${b}`);
  });
});
