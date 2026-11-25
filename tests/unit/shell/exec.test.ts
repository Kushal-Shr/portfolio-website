import { describe, expect, it } from 'vitest';
import { profile } from '@/content/profile';
import { RESUME_PHONE_WIDTH, RESUME_WIDTH } from '@/lib/resume';
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
    expect(lines[1]).toBe('  cd <dir>                        move around: every folder is a page');
    expect(lines).toContain('  open <page>                     jump to any page: open zenith');
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
      'dashboard/  about.md  projects/  experience/  leadership/  skills/  resume.txt  journey/  guide.md',
    );
    expect(line).toMatchObject({
      items: expect.arrayContaining([{ text: 'projects/', tone: 'dir', bold: true }]),
    });
  });

  it('lists all five projects as folders', () => {
    expect(out('ls projects')[0]).toBe('rant-and-heal/  zenith/  surgipath/  airdesk/  sanctuary/');
    expect(out('ls projects/zenith')[0]).toBe('README.md  architecture.txt');
  });

  it('supports -l and ll, with each page route in dim', () => {
    const lines = out('ls -l');
    expect(lines[0]).toBe('total 9');
    expect(lines[1]).toBe('drwxr-xr-x  guest  staff  dashboard/    /dashboard/');
    expect(lines[2]).toBe('-rw-r--r--  guest  staff  about.md    /about/');
    expect(out('ll')).toEqual(lines);
    expect(out('ls -l projects')[1]).toBe(
      'drwxr-xr-x  guest  staff  rant-and-heal/    /projects/rant-and-heal/',
    );
    expect(out('ls -l projects/zenith')[1]).toBe('-rw-r--r--  guest  staff  README.md');
    expect(run('ls -l').lines[1]).toMatchObject({
      segments: [{ tone: 'dir', bold: true }, { tone: 'dim' }],
    });
  });

  it('lists the current directory, not home, with no argument', () => {
    expect(out('ls', '~/projects')[0]).toBe(
      'rant-and-heal/  zenith/  surgipath/  airdesk/  sanctuary/',
    );
    expect(out('ls -l', '~/projects/zenith')[0]).toBe('total 2');
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

  it('enters a directory, prints nothing and returns the page to navigate to', () => {
    const r = run('cd projects');
    expect(r.cwd).toBe('~/projects');
    expect(r.lines).toEqual([]);
    expect(r.navigate).toBe('/projects/');
    expect(run('cd projects/zenith').navigate).toBe('/projects/zenith/');
    expect(run('cd ~/leadership/achievements').navigate).toBe('/leadership/achievements/');
    expect(run('cd ..', '~/projects').navigate).toBe('/');
  });

  it('handles the path edge cases', () => {
    expect(run('cd ../..', '~/projects/zenith').cwd).toBe('~');
    expect(run('cd ~/projects/../leadership').cwd).toBe('~/leadership');
    expect(run('cd projects/').cwd).toBe('~/projects');
    expect(run('cd ..', '~').cwd).toBe('~');
  });

  it('opens page files (about, resume, guide), with or without the extension', () => {
    for (const [input, route] of [
      ['cd about', '/about/'],
      ['cd about.md', '/about/'],
      ['cd resume', '/resume/'],
      ['cd ~/guide', '/guide/'],
      ['cd ../guide.md', '/guide/'],
    ] as const) {
      const r = run(input, input.includes('..') ? '~/projects' : '~');
      expect(r.navigate).toBe(route);
      expect(r.cwd).toBe('~');
    }
    expect(out('cd about')).toEqual(['↗ about.md is a page, not a folder — opening it -> /about/']);
    expect(run('cd archive', '~/journey')).toMatchObject({
      cwd: '~/journey',
      navigate: '/journey/archive/',
    });
  });

  it('refuses plain files, outside paths and missing paths without navigating', () => {
    for (const input of ['cd projects/zenith/README.md', 'cd /etc', 'cd nowhere']) {
      expect(run(input).navigate).toBeUndefined();
    }
    expect(out('cd projects/zenith/README.md')).toEqual([
      'cd: not a directory: projects/zenith/README.md',
    ]);
    expect(out('cd /etc')).toEqual(['cd: permission denied: /etc (you live in ~ here)']);
    expect(out('cd nowhere')).toEqual(['cd: no such file or directory: nowhere']);
    expect(run('cd /etc', '~/projects').cwd).toBe('~/projects');
  });

  it('goes back with cd -, printing the path', () => {
    const r = run('cd -', '~/projects', { prevCwd: '~/leadership' });
    expect(r.cwd).toBe('~/leadership');
    expect(r.lines.map(plain)).toEqual(['~/leadership']);
    expect(r.navigate).toBe('/leadership/');
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

  it("prints a project's README and links to the project page", () => {
    expect(out('cat projects/zenith/README.md')).toEqual([
      '# zenith (Ghost Visualizer)',
      'VS Code extension for live data structure visualization (TypeScript, p5.js)',
      'stack: TypeScript, VS Code API, LLM, p5.js',
      'result: low-latency AST parsing + live algorithm playback',
      '↗ open ~/projects/zenith as a page -> /projects/zenith/',
    ]);
  });

  it("prints a folder's README when it has one", () => {
    const lines = out('cat projects/zenith');
    expect(lines[0]).toBe('(zenith/ is a folder — showing zenith/README.md)');
    expect(lines[1]).toBe('# zenith (Ghost Visualizer)');
    expect(lines.at(-1)).toBe('↗ open ~/projects/zenith as a page -> /projects/zenith/');
    expect(run('cat projects/zenith').lines[0]).toMatchObject({ segments: [{ tone: 'dim' }] });
  });

  it('resolves relative paths from another directory', () => {
    expect(out('cat ../projects/zenith/README.md', '~/leadership')[0]).toBe(
      '# zenith (Ghost Visualizer)',
    );
    expect(out('cat ~/projects/zenith/README.md', '~/leadership')[0]).toBe(
      '# zenith (Ghost Visualizer)',
    );
  });

  it('shows the Sanctuary placeholder dim, in brackets', () => {
    const r = run('cat projects/sanctuary/README.md');
    const todo = r.lines.find((l) => plain(l).startsWith('[add:'));
    expect(todo).toMatchObject({ segments: [{ tone: 'dim' }] });
    expect(plain(todo!)).toBe('[add: the parts of Sanctuary you built yourself]');
  });

  it('never links Devpost from Rant & Heal', () => {
    expect(out('cat projects/rant-and-heal').join('\n')).not.toMatch(/devpost/i);
    expect(out('cat projects/rant-and-heal/architecture.txt').join('\n')).not.toMatch(/devpost/i);
  });

  it('prints the architecture diagram', () => {
    const lines = out('cat projects/zenith/architecture.txt');
    expect(lines[0]).toBe('# architecture');
    expect(lines[1]).toContain('┌────────┐');
  });

  it('prints the real resume with a wget link', () => {
    const lines = out('cat resume.txt');
    expect(lines.map((l) => l.trim())).toContain('Kushal Shrestha');
    expect(lines.join('\n')).toContain('Frontend Software Engineering Intern');
    expect(lines).toContain('↗ wget resume.pdf -> /resume.pdf');
    expect(lines.at(-1)).toBe('↗ open ~/resume.txt as a page -> /resume/');
  });

  it('carries a narrow resume for terminals too small for the wide one', () => {
    const fit = run('cat resume.txt').lines.find((l) => l.kind === 'fit');
    if (fit?.kind !== 'fit') throw new Error('no fixed-width block');
    const width = (rows: typeof fit.wide) =>
      Math.max(...rows.map((row) => [...row.map((s) => s.text).join('')].length));
    expect(width(fit.wide)).toBe(RESUME_WIDTH);
    expect(width(fit.narrow)).toBeLessThanOrEqual(RESUME_PHONE_WIDTH);
  });

  it('prints experience, skills and achievements from content', () => {
    expect(out('cat experience')[0]).toBe(
      '(experience/ is a folder — showing experience/README.md)',
    );
    expect(out('cat experience/README.md')[0]).toBe(
      '2025-05 → 2026-09  Data Engineering Intern @ Schnuck Markets',
    );
    expect(out('cat experience/schnuck')[1]).toBe(
      '# Data Engineering Intern @ Schnuck Markets, Inc.',
    );
    expect(out('cat skills/README.md')[0]).toBe(
      'languages    SQL, Python, C++, TypeScript, JavaScript',
    );
    expect(out('cat skills/README.md')[4]).toBe('building     Rant & Heal, SurgiPath');
    expect(out('cat leadership/achievements/README.md').slice(0, 4)).toEqual([
      '# achievements',
      'Webster Hackfest 2025   Best Overall Project (Rant & Heal)',
      'PickHacks 2025          Community Vote Winner (real-life Among Us)',
      'Byte Bash 2.0           1st Place',
    ]);
    expect(out('cat leadership/president/README.md')[0]).toBe(
      '# President · Computer Science Club',
    );
    expect(out('cat leadership/achievements/hackfest-2025')[1]).toBe('# Webster Hackfest 2025');
  });

  it('prints a skill page the way apt show does', () => {
    expect(out('cat skills/python/README.md').slice(0, 3)).toEqual([
      'Package:  Python',
      'Section:  languages',
      'Status:   install ok installed',
    ]);
  });

  it('explains usage and errors', () => {
    expect(out('cat')).toEqual(['usage: cat <file>   (try: cat about.md)']);
    expect(out('cat journey')).toEqual(['cat: journey: Is a directory — try: cd journey']);
    expect(out('cat nope')).toEqual(['cat: nope: No such file or directory']);
    expect(out('less about.md')).toEqual(out('cat about.md'));
  });
});

describe('tree', () => {
  it('shows two levels by default, from the current directory', () => {
    const lines = out('tree');
    expect(lines.slice(0, 8)).toEqual([
      '~',
      '├── dashboard/',
      '│   └── index.tui',
      '├── about.md',
      '├── projects/',
      '│   ├── rant-and-heal/',
      '│   ├── zenith/',
      '│   ├── surgipath/',
    ]);
    expect(lines.at(-1)).toMatch(/^\d+ directories, \d+ files$/);
    expect(lines.join('\n')).not.toContain('architecture.txt');
  });

  it('shows every layer with -L 3', () => {
    const lines = out('tree -L 3');
    expect(lines).toContain('│   │   └── architecture.txt');
    expect(lines).toContain('│   ├── president/');
    expect(lines.join('\n')).toContain('hackfest-2025/');
    expect(out('tree -L3')).toEqual(lines);
  });

  it('supports a depth of 1 and a path argument', () => {
    expect(out('tree -L 1').join('\n')).toMatchInlineSnapshot(`
      "~
      ├── dashboard/
      ├── about.md
      ├── projects/
      ├── experience/
      ├── leadership/
      ├── skills/
      ├── resume.txt
      ├── journey/
      └── guide.md
      6 directories, 3 files"
    `);
    expect(out('tree projects/zenith')).toEqual([
      '~/projects/zenith',
      '├── README.md',
      '└── architecture.txt',
      '0 directories, 2 files',
    ]);
    expect(out('tree', '~/projects/zenith')[0]).toBe('~/projects/zenith');
    expect(out('tree nope')).toEqual(['nope [error opening dir]']);
  });
});

describe('open', () => {
  it('opens paths and returns the page to navigate to', () => {
    const r = run('open projects/zenith');
    expect(r.lines.map(plain)).toEqual(['↗ opening ~/projects/zenith -> /projects/zenith/']);
    expect(r.navigate).toBe('/projects/zenith/');
    expect(r.cwd).toBe('~');
    expect(run('open about.md').navigate).toBe('/about/');
    expect(run('xdg-open resume.txt').navigate).toBe('/resume/');
    expect(run('open ~').navigate).toBe('/');
  });

  it('finds pages by name from anywhere', () => {
    expect(run('open zenith').navigate).toBe('/projects/zenith/');
    expect(run('open python').navigate).toBe('/skills/python/');
    expect(run('open skills').navigate).toBe('/skills/');
    expect(run('open resume').navigate).toBe('/resume/');
    expect(run('open dashboard').navigate).toBe('/dashboard/');
    expect(run('open about').navigate).toBe('/about/');
    expect(run('open guide').navigate).toBe('/guide/');
    expect(run('open hackfest-2025', '~/projects').navigate).toBe(
      '/leadership/achievements/hackfest-2025/',
    );
    expect(out('open zenith', '~/skills')).toEqual([
      '↗ opening ~/projects/zenith -> /projects/zenith/',
    ]);
  });

  it('lists candidates when a name matches several pages, without navigating', () => {
    const fs = { ...ctx.fs };
    fs['~/skills/zenith'] = { type: 'dir', children: [], route: '/skills/zenith/' };
    const r = exec('open zenith', { cwd: '~', history: [] }, { ...ctx, fs });
    expect(r.navigate).toBeUndefined();
    expect(r.lines.map(plain)).toEqual([
      'open: 2 matches for zenith — be specific:',
      '~/projects/zenith  ~/skills/zenith',
    ]);
  });

  it('opens the current folder with no argument, except at home', () => {
    expect(run('open', '~/projects').navigate).toBe('/projects/');
    expect(out('open')).toEqual(['open: nothing to open at ~ — try: open projects']);
  });

  it('explains when there is nothing to open', () => {
    expect(out('open nothing')).toEqual(['open: nothing to open at nothing — try: open projects']);
    expect(run('open nothing').navigate).toBeUndefined();
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

  it('neofetch from the dock sends you home to see the portrait', () => {
    const r = exec('neofetch', { cwd: '~/projects', history: [] }, { ...ctx, surface: 'dock' });
    expect(r.lines).toEqual([]);
    expect(r.navigate).toBe('/?run=neofetch');
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
      `mail      ${profile.email} -> mailto:${profile.email}`,
      `github    ${profile.links.github.label} -> ${profile.links.github.href}`,
      `linkedin  ${profile.links.linkedin.label} -> ${profile.links.linkedin.href}`,
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
