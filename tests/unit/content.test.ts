import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as content from '@/content';
import { achievements } from '@/content/achievements';
import { experience } from '@/content/experience';
import { isTodo } from '@/content/types';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { walk } from '@/lib/content-walk';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

function strings(value: unknown, name: string): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  walk(value, name, (node, path) => {
    if (typeof node === 'string') out.push({ path, text: node });
  });
  return out;
}

const allContent = Object.entries(content)
  .filter(([, v]) => typeof v !== 'function')
  .flatMap(([name, v]) => strings(v, name));

describe('uniqueness and shape', () => {
  it('has unique ids and slugs', () => {
    const unique = (values: readonly string[]) => new Set(values).size === values.length;
    expect(unique(projects.map((p) => p.slug))).toBe(true);
    expect(unique(experience.map((e) => e.id))).toBe(true);
    expect(unique(experience.map((e) => e.commit))).toBe(true);
    expect(unique(achievements.map((a) => a.id))).toBe(true);
    expect(unique(content.leadership.map((l) => l.pid))).toBe(true);
  });

  it('has exactly one featured project', () => {
    expect(projects.filter((p) => p.featured)).toHaveLength(1);
    expect(projects.find((p) => p.featured)?.slug).toBe('rant-and-heal');
  });

  it('has exactly 5 projects, with Sanctuary last and off the resume', () => {
    expect(projects.map((p) => p.slug)).toEqual([
      'rant-and-heal',
      'zenith',
      'surgipath',
      'airdesk',
      'sanctuary',
    ]);
    const sanctuary = projects.find((p) => p.slug === 'sanctuary');
    expect(sanctuary?.onResume).toBe(false);
    expect(sanctuary?.team).toEqual({ size: 4 });
    expect(sanctuary?.bullets.some(isTodo)).toBe(true);
    expect(projects.filter((p) => p.onResume).map((p) => p.slug)).toEqual([
      'rant-and-heal',
      'zenith',
      'surgipath',
      'airdesk',
    ]);
  });

  it('links Rant & Heal to source only', () => {
    const rant = projects.find((p) => p.slug === 'rant-and-heal');
    expect(rant?.links.source).toBe('https://github.com/Kushal-Shr/rant-and-heal-v2');
    expect(rant?.links.devpost).toBeUndefined();
    expect(achievements.find((a) => a.project === 'rant-and-heal')?.link).toContain('devpost.com');
  });

  it('resolves every cross-reference', () => {
    for (const a of achievements) {
      if (a.project) expect(projects.some((p) => p.slug === a.project)).toBe(true);
    }
    for (const e of content.extraProjects) {
      expect(achievements.some((a) => a.id === e.achievementId)).toBe(true);
    }
  });

  it('matches the "three competition wins" resume summary', () => {
    expect(achievements).toHaveLength(3);
    expect(profile.resumeSummary).toContain('three competition wins');
  });
});

describe('dates', () => {
  const ym = /^\d{4}-(0[1-9]|1[0-2])$/;

  it('uses YYYY-MM and start <= end', () => {
    for (const e of experience) {
      expect(e.start).toMatch(ym);
      if (e.end !== 'present') {
        expect(e.end).toMatch(ym);
        expect(e.start <= e.end).toBe(true);
      }
    }
  });

  it('is sorted newest first by end date', () => {
    const ends = experience.map((e) => (e.end === 'present' ? '9999-12' : e.end));
    expect(ends).toEqual([...ends].sort().reverse());
  });
});

describe('links', () => {
  it('uses https or mailto everywhere and every URL parses', () => {
    const urls = allContent.filter(({ text }) => /^(https?:|mailto:)/.test(text));
    expect(urls.length).toBeGreaterThan(5);
    for (const { path, text } of urls) {
      expect(text, path).toMatch(/^(https:\/\/|mailto:)/);
      expect(() => new URL(text), path).not.toThrow();
    }
  });

  it('gives every project a link and a diagram description', () => {
    for (const p of projects) {
      expect(Object.values(p.links).filter(Boolean).length, p.slug).toBeGreaterThan(0);
      expect(p.diagramAlt.trim().length, p.slug).toBeGreaterThan(0);
    }
  });
});

describe('diagrams', () => {
  it('keeps every line within 60 columns (widest is 56, rant-and-heal wide)', () => {
    const widths = projects.flatMap((p) =>
      [p.diagram, p.diagramWide ?? ''].flatMap((d) => d.split('\n').map((l) => [...l].length)),
    );
    expect(Math.max(...widths)).toBeLessThanOrEqual(60);
  });

  it('matches the design artboards for the four designed projects', () => {
    const pres = (file: string) =>
      [...read(file).matchAll(/<pre aria-hidden="true"[^>]*>([\s\S]*?)<\/pre>/g)].map((m) =>
        (m[1] ?? '').replace(/&amp;/g, '&'),
      );
    const fromProjects = pres('design/artboards/Projects.dc.html');
    ['rant-and-heal', 'zenith', 'surgipath', 'airdesk'].forEach((slug, i) => {
      expect(projects.find((p) => p.slug === slug)?.diagram, slug).toBe(fromProjects[i]);
    });
    expect(projects[0]?.diagramWide).toBe(pres('design/artboards/Tui.dc.html')[0]);
  });
});

describe('portrait', () => {
  const extract = (file: string): string[] => {
    const match = /var PORTRAIT = (\[[^\n]*\]);/.exec(read(file));
    return JSON.parse(match?.[1] ?? '[]') as string[];
  };

  it('matches the Main artboard exactly', () => {
    expect([...content.PORTRAIT]).toEqual(extract('design/artboards/Main.dc.html'));
  });

  it('is identical in the Tui artboard', () => {
    expect(extract('design/artboards/Tui.dc.html')).toEqual(
      extract('design/artboards/Main.dc.html'),
    );
  });
});

describe('placeholders', () => {
  it('never leaves a raw "[add:" string (use todo())', () => {
    expect(allContent.filter(({ text }) => text.includes('[add:'))).toEqual([]);
  });
});

describe('resume cross-check', () => {
  const resume = read('design/source/resume.md');
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  // Commit hashes and ids are not facts from the resume.
  const factStrings = [
    ...experience.flatMap((e, i) => strings({ ...e, id: '', commit: '' }, `experience[${i}]`)),
    ...strings(profile, 'profile'),
  ];

  it('finds every YYYY-MM date in the resume as "Month YYYY"', () => {
    const dates = factStrings.flatMap(
      ({ text }) => text.match(/\b\d{4}-(?:0[1-9]|1[0-2])\b/g) ?? [],
    );
    expect(dates.length).toBeGreaterThan(0);
    for (const d of new Set(dates)) {
      const [y, m] = d.split('-') as [string, string];
      expect(resume, d).toContain(`${MONTHS[Number(m) - 1]} ${y}`);
    }
  });

  it('finds every percentage, count and year in the resume', () => {
    const tokens = factStrings
      .filter(
        ({ path, text }) =>
          !path.startsWith('profile.neofetch') &&
          !/^(https?:|mailto:|\/)/.test(text) &&
          !/[\w-]+\.\w+\//.test(text),
      )
      .flatMap(({ text }) =>
        (text.replace(/\b\d{4}-\d{2}\b/g, '').match(/\d+(?:\.\d+)?[%+]?/g) ?? []).map((t) => t),
      );
    expect(tokens.length).toBeGreaterThan(5);
    for (const token of new Set(tokens)) {
      const escaped = token.replace(/[+.]/g, '\\$&');
      expect(new RegExp(`(?<![\\d.])${escaped}(?![\\d])`).test(resume), token).toBe(true);
    }
  });

  it('keeps the headline metrics', () => {
    const text = experience.map((e) => e.bullets.join(' ')).join(' ');
    for (const metric of [
      '20%',
      '10+ datasets',
      '3 core',
      '100%',
      '300 daily',
      '30%',
      '40%',
      '35%',
    ]) {
      expect(text, metric).toContain(metric);
    }
    expect(profile.education.gpa).toBe(3.82);
  });

  it('uses the resume titles', () => {
    expect(experience.map((e) => e.title)).toEqual([
      'Data Engineering Intern',
      'Frontend Software Engineering Intern',
      'Website Management Intern',
      'Data Science Instructor',
    ]);
    expect(profile.education.degree).toBe('Bachelor of Science in Computer Science');
  });
});

describe('phone guard', () => {
  const phone = /\d{3}[-. ]\d{3}[-. ]\d{4}/;

  function files(dir: string): string[] {
    const full = join(root, dir);
    return readdirSync(full).flatMap((name) => {
      const path = join(dir, name);
      return statSync(join(root, path)).isDirectory() ? files(path) : [path];
    });
  }

  it('has no phone-like pattern in content, app, components or lib', () => {
    const hits = ['content', 'app', 'components', 'lib']
      .flatMap(files)
      .filter((f) => /\.(tsx?|css|md|json)$/.test(f) && phone.test(read(f)));
    expect(hits).toEqual([]);
  });

  it('has no phone field on the profile', () => {
    expect(Object.keys(profile).some((k) => /phone|tel/i.test(k))).toBe(false);
  });
});
