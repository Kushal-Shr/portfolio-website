import { describe, expect, it } from 'vitest';
import { guide } from '@/content/guide';
import { skillGroups } from '@/content/skills';
import { createGuideContext, DEFAULT_MAX_LINES, renderGuideExample } from '@/lib/guide';
import { plain } from './shell/helpers';
import {
  filterMessage,
  parseSection,
  SKILL_SECTIONS,
  sectionQuery,
  skillCounts,
} from '@/lib/skills';

const ctx = createGuideContext(new Date(2026, 10, 19));
const items = guide.sections.flatMap((s) => s.items);
const render = (cmd: string, opts = {}) => renderGuideExample(cmd, opts, ctx).lines.map(plain);

describe('guide examples run through the real shell', () => {
  it.each(items.filter((i) => i.kind === 'command'))(
    '$cmd never produces "command not found"',
    (item) => {
      const lines = renderGuideExample(item.cmd, item, ctx).lines.map(plain);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.join('\n')).not.toContain('command not found');
    },
  );

  it('uses a real engine command in every run-it link', () => {
    for (const item of items.filter((i) => i.kind === 'command')) {
      const cmd = item.show ?? item.cmd;
      expect(
        renderGuideExample(cmd, { setup: item.setup }, ctx).lines.map(plain).join(' '),
      ).not.toContain('command not found');
    }
  });

  it('truncates long output with an ellipsis', () => {
    const lines = render('tree', { maxLines: 5 });
    expect(lines.slice(0, 5)).toEqual([
      '~',
      '├── dashboard/',
      '│   └── index.tui',
      '├── about.md',
      '├── projects/',
    ]);
    expect(lines[5]).toBe('…');
    expect(lines).toHaveLength(6);
  });

  it('defaults to four body lines', () => {
    const lines = render('tree');
    expect(lines).toHaveLength(DEFAULT_MAX_LINES + 1);
    expect(lines.at(-1)).toBe('…');
  });

  it('keeps the "open as a page" link after truncation', () => {
    const lines = render('cat about.md', { maxLines: 2 });
    expect(lines[0]).toBe('# about');
    expect(lines).toContain('…');
    expect(lines.at(-1)).toBe('↗ open ~/about.md as a page -> /about/');
  });

  it('does not truncate short output', () => {
    expect(renderGuideExample('pwd', {}, ctx).truncated).toBe(false);
    expect(render('ls')).toHaveLength(1);
  });

  it('runs setup commands first', () => {
    expect(render('pwd', { setup: ['cd projects'] })).toEqual(['/home/guest/projects']);
    expect(render('cd ..', { setup: ['cd projects'] })).toEqual(['the prompt changes to ~']);
  });

  it('describes a directory change and keeps the page link', () => {
    expect(render('cd projects')).toEqual([
      'the prompt changes to ~/projects',
      '↗ open ~/projects as a page -> /projects/',
    ]);
  });

  it('shows real history for the clear item', () => {
    const clear = items.find((i) => i.cmd === 'clear');
    expect(clear?.show).toBe('history');
    expect(renderGuideExample(clear!.cmd, clear!, ctx).lines.map(plain)).toEqual([
      '    1  neofetch',
      '    2  ls',
      '    3  cd projects',
    ]);
  });

  it('computes Tab completion for the cd pro item', () => {
    const item = items.find((i) => i.cmd === 'cd pro');
    expect(item?.complete).toBe(true);
    expect(item?.output).toBeUndefined();
    expect(render('cd pro', { complete: true })).toEqual(['cd projects/']);
  });

  it('renders a compact neofetch with a portrait placeholder', () => {
    const lines = render('neofetch');
    expect(lines[0]).toBe('[ascii portrait]   guest@portfolio');
    expect(lines[1]).toContain('Name:  Kushal Shrestha');
    expect(lines.at(-1)).toBe('…');
  });

  it('only keeps static output for the arrow-key item', () => {
    expect(items.filter((i) => i.output).map((i) => i.cmd)).toEqual(['↑  ↓']);
  });
});

describe('skills sections', () => {
  const counts = skillCounts(skillGroups);

  it('merges languages and web into one box and totals the rest', () => {
    expect(counts).toEqual({ all: 25, languages: 10, 'ai-data': 7, cloud: 8 });
  });

  it('parses ?section= defensively', () => {
    expect(parseSection('?section=cloud')).toBe('cloud');
    expect(parseSection('?section=ai-data')).toBe('ai-data');
    expect(parseSection('?section=nope')).toBe('all');
    expect(parseSection('')).toBe('all');
    expect(parseSection('?x=1&section=languages')).toBe('languages');
  });

  it('builds the live-region message from the counts', () => {
    expect(filterMessage('all', counts)).toBe('Showing all 25 packages');
    expect(filterMessage('cloud', counts)).toBe('Showing 8 packages in cloud');
  });

  it('omits ?section=all from the URL', () => {
    expect(sectionQuery('all')).toBe('');
    expect(sectionQuery('cloud')).toBe('?section=cloud');
    expect(SKILL_SECTIONS).toEqual(['all', 'languages', 'ai-data', 'cloud']);
  });
});
