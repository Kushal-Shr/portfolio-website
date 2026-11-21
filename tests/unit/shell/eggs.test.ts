import { describe, expect, it } from 'vitest';
import { ALL_COMMANDS, COMMANDS } from '@/lib/shell/commands';
import { cowsay } from '@/lib/shell/eggs';
import { GIT_LOG_PATH } from '@/lib/shell/fs';
import { milestones, shortHash } from '@/lib/milestones';
import { experience } from '@/content/experience';
import { achievements } from '@/content/achievements';
import { profile } from '@/content/profile';
import { exec } from '@/lib/shell/exec';
import { ctx, out, plain, run, state } from './helpers';

describe('easter eggs', () => {
  it('rm refuses, politely, and names what you tried to remove', () => {
    expect(out('rm -rf node_modules')).toEqual([
      "rm: cannot remove 'node_modules': this portfolio is read-only (but my calendar isn't: sudo hire-me)",
    ]);
    expect(run('rm x').lines[0]).toMatchObject({ segments: [{ tone: 'err' }] });
    expect(out('rm')[0]).toMatch(/^rm: missing operand/);
  });

  it.each(['vim', 'vi', 'nano', 'emacs'])('%s is not installed', (editor) => {
    expect(out(`${editor} notes.txt`)).toEqual([
      `${editor}: not installed. the only editor here is reality. try: cat about.md`,
    ]);
  });

  it.each(['matrix', 'hack'])('%s is access denied', (cmd) => {
    expect(out(cmd)).toEqual(['access denied. nice try, though.']);
  });

  it('git alone points at GitHub', () => {
    const lines = run('git').lines;
    expect(lines.map(plain)).toEqual([
      'git: nothing to commit here. the real repositories live on GitHub:',
      `${profile.links.github.label} -> ${profile.links.github.href}`,
    ]);
    expect(lines[1]).toMatchObject({ kind: 'link', external: true });
    expect(out('git status')).toEqual(out('git'));
  });

  it('git log lists real milestones from content, newest first', () => {
    const lines = out('git log --oneline');
    expect(lines.length).toBe(experience.length + achievements.filter((a) => a.year).length);
    expect(lines.some((l) => l.includes(experience[0]!.commit))).toBe(true);
    expect(lines.some((l) => l.includes('won: Best Overall Project, Webster Hackfest 2025'))).toBe(
      true,
    );
    expect(
      lines.some((l) => l.includes('started: Data Engineering Intern @ Schnuck Markets')),
    ).toBe(true);
    expect(out('git log')).toEqual(lines);
    // The hash is the yellow part, like `git log --oneline`.
    expect(run('git log').lines[0]).toMatchObject({ segments: [{ tone: 'warn' }, {}] });
  });

  it('git log without milestones says so instead of crashing', () => {
    const rest = { ...ctx.fs };
    delete rest[GIT_LOG_PATH];
    const empty = { ...ctx, fs: rest };
    expect(plain(exec('git log', state(), empty).lines[0]!)).toMatch(/no commits yet/);
  });

  it('keeps the commit list out of every listing, but cat can read it', () => {
    expect(out('ls -a')).not.toContain('.git');
    expect(out('tree').join('\n')).not.toContain('.git');
    expect(out('cat .git/log')).toEqual(out('git log'));
  });

  it('ping kushal answers with a copyable mailto link', () => {
    const lines = run('ping kushal').lines;
    expect(plain(lines[0]!)).toBe('PONG — usually replies within a day:');
    expect(lines[1]).toMatchObject({
      kind: 'link',
      href: `mailto:${profile.email}`,
      copy: profile.email,
    });
    expect(out('ping nobody')[0]).toMatch(/unknown host/);
    expect(out('ping')[0]).toMatch(/usage/);
  });

  it('contact offers [copy] for the email only', () => {
    const lines = run('contact').lines;
    expect(lines[0]).toMatchObject({ copy: profile.email });
    expect(lines[1]).not.toHaveProperty('copy');
  });

  it('is not listed in help, but Tab knows every one of them', () => {
    const help = out('help').join('\n');
    for (const cmd of ['rm', 'vim', 'git', 'ping', 'cowsay', 'matrix', 'hack']) {
      expect(help).not.toMatch(new RegExp(`\\b${cmd}\\b`));
    }
    for (const cmd of ['git', 'ping', 'cowsay', 'vim', 'rm']) expect(COMMANDS).toContain(cmd);
    for (const cmd of ['vi', 'nano', 'emacs', 'matrix', 'hack'])
      expect(ALL_COMMANDS).toContain(cmd);
  });
});

describe('cowsay', () => {
  it('draws the cow with a one-line bubble', () => {
    expect(cowsay('hire me')).toEqual([
      ' _________',
      '< hire me >',
      ' ---------',
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ]);
  });

  it('wraps long text into a multi-line bubble', () => {
    const lines = cowsay('a long sentence that needs more than one line to say what it means');
    const bubble = lines.slice(1, -6);
    expect(bubble.length).toBeGreaterThan(1);
    expect(bubble[0]).toMatch(/^\/ .* \\$/);
    expect(bubble.at(-1)).toMatch(/^\\ .* \/$/);
    expect(new Set(bubble.map((l) => l.length)).size).toBe(1);
  });

  it('says moo when you give it nothing, and runs through exec', () => {
    expect(cowsay('')[1]).toBe('< moo >');
    expect(out('cowsay sudo hire-me')[1]).toBe('< sudo hire-me >');
  });
});

describe('milestones', () => {
  it('hashes deterministically to 7 hex characters', () => {
    expect(shortHash('hackfest-2025')).toMatch(/^[0-9a-f]{7}$/);
    expect(shortHash('hackfest-2025')).toBe(shortHash('hackfest-2025'));
    expect(shortHash('a')).not.toBe(shortHash('b'));
  });

  it('counts a win as the end of its year, so it sits above jobs that started that year (newest first)', () => {
    const log = milestones(experience, achievements);
    const win = log.findIndex((m) => m.text.includes('Hackfest 2025'));
    const schnuck = log.findIndex((m) => m.text.includes('Schnuck'));
    expect(win).toBeGreaterThanOrEqual(0);
    expect(schnuck).toBeGreaterThanOrEqual(0);
    expect(win).toBeLessThan(schnuck);
    // Wins with no year (Byte Bash 2.0) can't be placed in time, so they are left out.
    expect(log.some((m) => m.text.includes('Byte Bash'))).toBe(false);
  });
});
