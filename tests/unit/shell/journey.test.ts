import { describe, expect, it } from 'vitest';
import { complete } from '@/lib/shell/complete';
import { journeyCtx, outJ, runJ, state } from './helpers';

const NEWEST = [
  '── 2026-11-19 ──',
  'learned  FAKE FIXTURE: the newest test entry, used by the e2e and unit tests.',
  'built    FAKE FIXTURE: a pretend feature with a pretend link.',
  '         ↗ https://example.com/fixture/newest -> https://example.com/fixture/newest',
  'stuck on FAKE FIXTURE: nothing; this is test data.',
  "next     FAKE FIXTURE: tomorrow's pretend task.",
];

describe('journey in the shell', () => {
  it('ls lists the newest 30 entries, then points at the archive', () => {
    const lines = outJ('ls journey');
    const items = lines[0]?.split('  ') ?? [];
    expect(items).toHaveLength(31);
    expect(items[0]).toBe('2026-11-19/');
    expect(items[29]).toBe('2026-10-15/');
    expect(items[30]).toBe('archive.log');
    expect(lines[1]).toBe('… 8 older: open archive');
  });

  it('ls -l caps the same way', () => {
    const lines = outJ('ls -l journey');
    expect(lines[0]).toBe('total 39');
    expect(lines).toHaveLength(1 + 31 + 1);
    expect(lines.at(-1)).toBe('… 8 older: open archive');
  });

  it('tree shows the capped listing too', () => {
    const lines = outJ('tree journey -L 1');
    expect(lines[0]).toBe('~/journey');
    expect(lines.at(-2)).toBe('└── … 8 older: open archive');
    expect(lines).toContain('├── archive.log');
  });

  it('cat on an entry folder shows its README in the design’s format', () => {
    expect(outJ('cat journey/2026-11-19')).toEqual([
      '(2026-11-19/ is a folder — showing 2026-11-19/README.md)',
      ...NEWEST,
      '↗ open ~/journey/2026-11-19 as a page -> /journey/2026-11-19/',
    ]);
    expect(outJ('cat journey/2026-11-19/README.md')).toEqual([
      ...NEWEST,
      '↗ open ~/journey/2026-11-19 as a page -> /journey/2026-11-19/',
    ]);
  });

  it('cat omits "stuck on" when there was nothing', () => {
    const lines = outJ('cat 2026-10-05/README.md', '~/journey');
    expect(lines.some((l) => l.startsWith('stuck on'))).toBe(false);
    expect(lines[0]).toBe('── 2026-10-05 ──');
  });

  it('tail shows the newest entry, from anywhere', () => {
    const expected = [
      '==> ~/journey/2026-11-19/README.md <==',
      ...NEWEST.slice(1),
      '↗ open the full journey log -> /journey/',
    ];
    expect(outJ('tail journey')).toEqual(expected);
    expect(outJ('tail')).toEqual(expected);
    expect(outJ('tail', '~/projects/zenith')).toEqual(expected);
  });

  it('cd navigates to a permalink, from anywhere', () => {
    expect(runJ('cd journey/2026-11-19')).toMatchObject({
      cwd: '~/journey/2026-11-19',
      navigate: '/journey/2026-11-19/',
    });
    expect(runJ('cd ~/journey/2026-11-02', '~/projects/zenith').navigate).toBe(
      '/journey/2026-11-02/',
    );
    expect(runJ('cd 2026-11-18', '~/journey').navigate).toBe('/journey/2026-11-18/');
    expect(runJ('cd ..', '~/journey/2026-11-18')).toMatchObject({
      cwd: '~/journey',
      navigate: '/journey/',
    });
  });

  it('open finds an entry and the archive by name', () => {
    expect(runJ('open 2026-11-19', '~/skills').navigate).toBe('/journey/2026-11-19/');
    expect(runJ('open archive').navigate).toBe('/journey/archive/');
    expect(runJ('open archive.log', '~/journey').navigate).toBe('/journey/archive/');
  });

  it('cat archive.log lists every entry by month, newest first', () => {
    const lines = outJ('cat journey/archive.log');
    expect(lines[0]).toBe('# November 2026');
    expect(lines[1]).toBe(
      '2026-11-19  day 46  learned: FAKE FIXTURE: the newest test entry, used by the e2e and un…',
    );
    expect(lines).toContain('# October 2026');
    expect(lines.filter((l) => /^\d{4}-/.test(l))).toHaveLength(38);
    expect(lines.at(-1)).toBe('↗ open ~/journey/archive.log as a page -> /journey/archive/');
  });

  it('completes across entries like any other folder', () => {
    const tab = (input: string, cwd = '~') => complete(input, state(cwd), journeyCtx);
    expect(tab('cd journey/2026-11-1').candidates).toEqual(
      expect.arrayContaining(['2026-11-19/', '2026-11-10/']),
    );
    expect(tab('cd journey/2026-11-19').value).toBe('cd journey/2026-11-19/');
    expect(tab('cd journey/2026-10-0').candidates).toEqual(
      expect.arrayContaining(['2026-10-05/', '2026-10-09/']),
    );
    expect(tab('cat journey/arc').value).toBe('cat journey/archive.log');
  });
});
