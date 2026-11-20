import { describe, expect, it } from 'vitest';
import { profile } from '@/content/profile';
import { ctx, out, plain, run, state } from './helpers';
import { exec } from '@/lib/shell/exec';

describe('empty and unknown input', () => {
  it('prints nothing for an empty line', () => {
    expect(run('   ').lines).toEqual([]);
  });

  it('reports unknown commands in red', () => {
    const r = run('foo');
    expect(r.lines.map(plain)).toEqual(['portfolio-sh: command not found: foo — try help']);
    expect(r.lines[0]).toMatchObject({ segments: [{ tone: 'err' }] });
  });

  it('suggests close matches for typos', () => {
    expect(out('sl')).toEqual([
      'portfolio-sh: command not found: sl — try help',
      'did you mean: ls?',
    ]);
    expect(out('nefetch')[1]).toBe('did you mean: neofetch?');
    expect(out('cta')[1]).toBe('did you mean: cat?');
  });

  it('is case-insensitive', () => {
    expect(out('LS')).toEqual(out('ls'));
    expect(run('Neofetch').lines).toEqual([{ kind: 'neofetch' }]);
    expect(out('PWD')).toEqual(['/home/guest']);
  });
});

describe('help', () => {
  it('lists commands with the first column padded to 34', () => {
    const lines = out('help');
    expect(lines[0]).toBe('  ls [dir]                        list files (-l for details)');
    expect(lines[0]?.indexOf('list')).toBe(34);
    expect(lines).toContain('  contact                         email, GitHub and LinkedIn');
    expect(lines.at(-1)).toBe('  pwd · history · date · clear');
  });
});

describe('ls', () => {
  it('lists the home directory with directories bold and blue', () => {
    const [line] = run('ls').lines;
    expect(line).toMatchObject({ kind: 'items' });
    expect(plain(line!)).toBe(
      'dashboard/  about.md  projects/  experience.log  leadership/  skills.txt  resume.txt  journey/',
    );
    expect(line).toMatchObject({
      items: expect.arrayContaining([{ text: 'projects/', tone: 'dir', bold: true }]),
    });
  });

  it('lists all five projects', () => {
    expect(out('ls projects')[0]).toBe(
      'rant-and-heal.md  zenith.md  surgipath.md  airdesk.md  sanctuary.md',
    );
  });

  it('supports -l and ll', () => {
    const lines = out('ls -l');
    expect(lines[0]).toBe('total 8');
    expect(lines[1]).toBe('drwxr-xr-x  guest  staff  dashboard/');
    expect(lines[2]).toBe('-rw-r--r--  guest  staff  about.md');
    expect(out('ll')).toEqual(lines);
  });

  it('prints the name for a file', () => {
    expect(out('ls about.md')).toEqual(['about.md']);
  });

  it('reports missing targets', () => {
    expect(out('ls nope')).toEqual(["ls: cannot access 'nope': No such file or directory"]);
    expect(out('ls /etc')).toEqual(["ls: cannot access '/etc': No such file or directory"]);
  });

  it('lists the parent from a subdirectory', () => {
    expect(out('ls ..', '~/projects')[0]).toContain('about.md');
  });
});

describe('cd', () => {
  it('goes home with no argument', () => {
    expect(run('cd', '~/projects').cwd).toBe('~');
  });

  it('enters a directory and offers the page link', () => {
    const r = run('cd projects');
    expect(r.cwd).toBe('~/projects');
    expect(r.lines.map(plain)).toEqual(['↗ open ~/projects as a page -> /projects/']);
  });

  it('handles the path edge cases', () => {
    expect(run('cd ../..', '~/projects').cwd).toBe('~');
    expect(run('cd ~/projects/../leadership').cwd).toBe('~/leadership');
    expect(run('cd projects/').cwd).toBe('~/projects');
    expect(run('cd ..', '~').cwd).toBe('~');
  });

  it('refuses files, outside paths and missing paths', () => {
    expect(out('cd about.md')).toEqual(['cd: not a directory: about.md']);
    expect(out('cd /etc')).toEqual(['cd: permission denied: /etc (you live in ~ here)']);
    expect(out('cd nowhere')).toEqual(['cd: no such file or directory: nowhere']);
    expect(run('cd /etc', '~/projects').cwd).toBe('~/projects');
  });

  it('goes back with cd -', () => {
    const r = run('cd -', '~/projects', { prevCwd: '~/leadership' });
    expect(r.cwd).toBe('~/leadership');
    expect(r.lines.map(plain)[0]).toBe('~/leadership');
    expect(run('cd -', '~').cwd).toBe('~');
  });
});

describe('pwd', () => {
  it('prints the virtual home path', () => {
    expect(out('pwd')).toEqual(['/home/guest']);
    expect(out('pwd', '~/projects')).toEqual(['/home/guest/projects']);
  });
});

describe('cat', () => {
  it('prints a file, a yellow bold heading and the page link', () => {
    const r = run('cat about.md');
    expect(r.lines[0]).toMatchObject({ segments: [{ text: '# about', tone: 'warn', bold: true }] });
    expect(r.lines.map(plain).at(-1)).toBe('↗ open ~/about.md as a page -> /about/');
    expect(plain(r.lines[1]!)).toContain('Webster University');
  });

  it('prints a project file', () => {
    expect(out('cat projects/zenith.md')).toEqual([
      '# zenith (Ghost Visualizer)',
      'VS Code extension for live data structure visualization (TypeScript, p5.js)',
      'stack: TypeScript, VS Code API, LLM, p5.js',
      'result: low-latency AST parsing + live algorithm playback',
      '↗ open ~/projects/zenith.md as a page -> /projects/#zenith',
    ]);
  });

  it('resolves relative paths from another directory', () => {
    expect(out('cat ../projects/zenith.md', '~/leadership')[0]).toBe('# zenith (Ghost Visualizer)');
    expect(out('cat ~/projects/zenith.md', '~/leadership')[0]).toBe('# zenith (Ghost Visualizer)');
  });

  it('shows the Sanctuary placeholder dim, in brackets', () => {
    const r = run('cat projects/sanctuary.md');
    const todo = r.lines.find((l) => plain(l).startsWith('[add:'));
    expect(todo).toMatchObject({ segments: [{ tone: 'dim' }] });
    expect(plain(todo!)).toBe('[add: the parts of Sanctuary you built yourself]');
  });

  it('never links Devpost from Rant & Heal', () => {
    expect(out('cat projects/rant-and-heal.md').join('\n')).not.toMatch(/devpost/i);
  });

  it('prints the real resume with a wget link', () => {
    const lines = out('cat resume.txt');
    expect(lines).toContain('Kushal Shrestha');
    expect(lines.join('\n')).toContain('Frontend Software Engineering Intern');
    expect(lines).toContain('↗ wget resume.pdf -> /resume.pdf');
    expect(lines.at(-1)).toBe('↗ open ~/resume.txt as a page -> /resume/');
  });

  it('prints experience, skills and achievements from content', () => {
    expect(out('cat experience.log')[0]).toBe(
      '2025-05 → 2026-09  Data Engineering Intern @ Schnuck Markets',
    );
    expect(out('cat skills.txt')[0]).toBe('languages    SQL, Python, C++, TypeScript, JavaScript');
    expect(out('cat skills.txt')[4]).toBe('learning     Agent Engine, machine learning');
    expect(out('cat leadership/achievements.md').slice(0, 4)).toEqual([
      '# achievements',
      'Webster Hackfest 2025   Best Overall Project (Rant & Heal)',
      'PickHacks 2025          Community Vote Winner (real-life Among Us)',
      'Byte Bash 2.0           1st Place',
    ]);
    expect(out('cat leadership/president.md')[0]).toBe('# President · Computer Science Club');
  });

  it('explains usage and errors', () => {
    expect(out('cat')).toEqual(['usage: cat <file>   (try: cat about.md)']);
    expect(out('cat projects')).toEqual(['cat: projects: Is a directory — try: cd projects']);
    expect(out('cat nope')).toEqual(['cat: nope: No such file or directory']);
    expect(out('less about.md')).toEqual(out('cat about.md'));
  });
});

describe('tree', () => {
  it('prints the whole site', () => {
    expect(out('tree').join('\n')).toMatchInlineSnapshot(`
      "~
      ├── dashboard/
      │   └── index.tui
      ├── about.md
      ├── projects/
      │   ├── rant-and-heal.md
      │   ├── zenith.md
      │   ├── surgipath.md
      │   ├── airdesk.md
      │   └── sanctuary.md
      ├── experience.log
      ├── leadership/
      │   ├── president.md
      │   ├── senator.md
      │   └── achievements.md
      ├── skills.txt
      ├── resume.txt
      └── journey/
      4 directories"
    `);
  });
});

describe('open', () => {
  it('opens paths and bare page names', () => {
    expect(out('open skills.txt')).toEqual(['↗ open ~/skills.txt -> /skills/']);
    expect(out('open skills')).toEqual(['↗ open ~/skills.txt -> /skills/']);
    expect(out('open resume')).toEqual(['↗ open ~/resume.txt -> /resume/']);
    expect(out('open dashboard')).toEqual(['↗ open ~/dashboard -> /dashboard/']);
    expect(out('open about')).toEqual(['↗ open ~/about.md -> /about/']);
    expect(out('open guide')[0]).toContain('-> /guide/');
    expect(out('open skills', '~/projects')).toEqual(['↗ open ~/skills.txt -> /skills/']);
    expect(out('xdg-open projects/zenith.md')).toEqual([
      '↗ open ~/projects/zenith.md -> /projects/#zenith',
    ]);
  });

  it('explains when there is nothing to open', () => {
    expect(out('open nothing')).toEqual(['open: nothing to open at nothing — try: open projects']);
    expect(out('open')).toEqual(['open: nothing to open at ~ — try: open projects']);
    expect(out('open', '~/projects')).toEqual(['↗ open ~/projects -> /projects/']);
  });
});

describe('tail', () => {
  it('says there are no journey entries yet', () => {
    expect(out('tail journey')).toEqual([
      'tail: ~/journey: no entries yet',
      '↗ open the full journey log -> /journey/',
    ]);
  });
});

describe('guide, neofetch and small commands', () => {
  it('guide and tldr point at the guide page', () => {
    expect(out('guide')).toEqual([
      'new to terminals? start with: neofetch → ls → cd projects → cat about.md',
      '↗ open the full guide -> /guide/',
    ]);
    expect(out('tldr')).toEqual(out('guide'));
  });

  it('neofetch and fastfetch render the card', () => {
    expect(run('neofetch').lines).toEqual([{ kind: 'neofetch' }]);
    expect(run('fastfetch').lines).toEqual([{ kind: 'neofetch' }]);
  });

  it('whoami keeps the hint', () => {
    expect(out('whoami')).toEqual([
      'guest',
      '(the person behind this site: run neofetch or cat about.md)',
    ]);
  });

  it('history numbers earlier commands, right-aligned to 5', () => {
    expect(out('history', '~', { history: ['neofetch', 'ls', 'cd projects'] })).toEqual([
      '    1  neofetch',
      '    2  ls',
      '    3  cd projects',
    ]);
  });

  it('date uses the injected clock', () => {
    expect(out('date')).toEqual([new Date(2026, 10, 19, 14, 5).toString()]);
  });

  it('echo joins its arguments', () => {
    expect(out('echo hello   world')).toEqual(['hello world']);
  });

  it('man links the about page', () => {
    expect(out('man kushal')).toEqual(['↗ man kushal — open the manual page -> /about/']);
    expect(out('man')).toEqual(out('man kushal'));
  });

  it('clear asks the UI to clear', () => {
    expect(run('clear')).toEqual({ lines: [], cwd: '~', clear: true });
  });
});

describe('sudo, exit and contact', () => {
  it('sudo hire-me grants access with a mailto link', () => {
    const r = run('sudo hire-me');
    expect(r.lines.map(plain)).toEqual([
      "[sudo] access granted. Let's talk:",
      `  ${profile.email} -> mailto:${profile.email}`,
    ]);
    expect(r.lines[0]).toMatchObject({ segments: [{ tone: 'ok' }] });
  });

  it('any other sudo is refused', () => {
    expect(out('sudo rm -rf /')).toEqual([
      'guest is not in the sudoers file. This incident will be reported. (psst: sudo hire-me)',
    ]);
    expect(out('sudo')[0]).toContain('not in the sudoers file');
  });

  it('exit and logout point at the resume', () => {
    expect(out('exit')).toEqual(['nice try. there is no escape — only ', 'the resume -> /resume/']);
    expect(out('logout')).toEqual(out('exit'));
  });

  it('contact lists email, GitHub and LinkedIn as links', () => {
    const r = run('contact');
    expect(r.lines.map(plain)).toEqual([
      `mail  ${profile.email} -> mailto:${profile.email}`,
      `gh    ${profile.links.github.label} -> ${profile.links.github.href}`,
      `in    ${profile.links.linkedin.label} -> ${profile.links.linkedin.href}`,
    ]);
  });
});

describe('privacy', () => {
  it('never prints a phone-like number from any file or command', () => {
    const everything = [
      ...Object.values(ctx.fs).flatMap((n) => (n.type === 'file' ? n.lines.map(plain) : [])),
      ...['help', 'contact', 'sudo hire-me', 'tree', 'neofetch'].flatMap((c) => out(c)),
    ].join('\n');
    expect(everything).not.toMatch(/\d{3}[-. ]\d{3}[-. ]\d{4}/);
  });
});

describe('exec is pure', () => {
  it('does not mutate its inputs', () => {
    const s = state('~/projects', { history: ['ls'] });
    const before = JSON.stringify([s, ctx.fs]);
    exec('cd ..', s, ctx);
    exec('cat zenith.md', s, ctx);
    expect(JSON.stringify([s, ctx.fs])).toBe(before);
  });
});
