import { ROUTES } from '@/lib/routes';
import { ALL_COMMANDS } from './commands';
import { link, seg, text } from './lines';
import { basename, isDir, isFile, joinPath, resolve } from './resolve';
import { suggest } from './suggest';
import type { ExecResult, Line, Segment, ShellContext, ShellState } from './types';

const HELP: readonly (readonly [string, string])[] = [
  ['ls [dir]', 'list files (-l for details)'],
  ['cd <dir>', 'move around: cd projects, cd .., cd ~'],
  ['cat <file>', 'read a file: cat about.md'],
  ['tree', 'the whole site at a glance'],
  ['open <page>', 'open any section as a full page'],
  ['tail journey', "today's entry in the daily log"],
  ['neofetch', 'who I am, with a picture'],
  ['contact', 'email, GitHub and LinkedIn'],
  ['guide', 'step-by-step how-to, with examples'],
  ['pwd · history · date · clear', ''],
];

const entryName = (fs: ShellContext['fs'], dir: string, name: string): Segment => {
  const d = isDir(fs, joinPath(dir, name));
  return d ? seg(`${name}/`, 'dir', true) : seg(name);
};

/** The "↗ open … as a page" link for a path that has its own page. */
function pageLink(ctx: ShellContext, path: string): Line[] {
  const route = ctx.fs[path]?.route;
  return route ? [link('↗ ', `open ${path} as a page`, route)] : [];
}

/** Runs one command line against the shell state. Pure: everything comes from the arguments. */
export function exec(input: string, state: ShellState, ctx: ShellContext): ExecResult {
  const { fs } = ctx;
  const cwd = state.cwd;
  const args = input.trim().split(/\s+/).filter(Boolean);
  const cmd = (args[0] ?? '').toLowerCase();
  const rest = args.slice(1);
  const flags = rest.filter((a) => a.startsWith('-')).join('');
  const target = rest.find((a) => !a.startsWith('-'));
  const ok = (lines: Line[], nextCwd = cwd): ExecResult => ({ lines, cwd: nextCwd });

  switch (cmd) {
    case '':
      return ok([]);

    case 'help':
      return ok(
        HELP.map(([name, what]) => text(what ? `  ${name}`.padEnd(34) + what : `  ${name}`)),
      );

    case 'ls':
    case 'll': {
      const path = resolve(target, cwd);
      if (path && isFile(fs, path)) return ok([text(target ?? '')]);
      const node = path ? fs[path] : undefined;
      if (!path || node?.type !== 'dir') {
        return ok([text(`ls: cannot access '${target}': No such file or directory`, 'err')]);
      }
      if (flags.includes('l') || cmd === 'll') {
        return ok([
          text(`total ${node.children.length}`, 'dim'),
          ...node.children.map((name): Line => {
            const d = isDir(fs, joinPath(path, name));
            const row = `${d ? 'drwxr-xr-x' : '-rw-r--r--'}  guest  staff  ${d ? `${name}/` : name}`;
            return text(row, d ? 'dir' : undefined, d);
          }),
        ]);
      }
      return ok([{ kind: 'items', items: node.children.map((n) => entryName(fs, path, n)) }]);
    }

    case 'cd': {
      const arg = rest[0];
      if (arg === '-') {
        const prev = state.prevCwd ?? cwd;
        return ok([text(prev, 'dim'), ...pageLink(ctx, prev)], prev);
      }
      const path = resolve(arg, cwd);
      if (path && isDir(fs, path)) return ok(pageLink(ctx, path), path);
      if (path && isFile(fs, path)) return ok([text(`cd: not a directory: ${arg}`, 'err')]);
      if (!path) {
        return ok([text(`cd: permission denied: ${arg} (you live in ~ here)`, 'err')]);
      }
      return ok([text(`cd: no such file or directory: ${arg}`, 'err')]);
    }

    case 'pwd':
      return ok([text(`/home/guest${cwd.slice(1)}`)]);

    case 'cat':
    case 'less':
    case 'more': {
      if (!target) return ok([text('usage: cat <file>   (try: cat about.md)', 'dim')]);
      const path = resolve(target, cwd);
      const node = path ? fs[path] : undefined;
      if (path && node?.type === 'file') return ok([...node.lines, ...pageLink(ctx, path)]);
      if (path && node?.type === 'dir') {
        return ok([text(`cat: ${target}: Is a directory — try: cd ${target}`, 'err')]);
      }
      return ok([text(`cat: ${target}: No such file or directory`, 'err')]);
    }

    case 'tree': {
      const root = fs['~'];
      const children = root?.type === 'dir' ? root.children : [];
      const lines: Line[] = [text('~', 'dir', true)];
      children.forEach((name, i) => {
        const last = i === children.length - 1;
        const d = isDir(fs, joinPath('~', name));
        lines.push(
          text(`${last ? '└── ' : '├── '}${d ? `${name}/` : name}`, d ? 'dir' : undefined, d),
        );
        const node = fs[joinPath('~', name)];
        const kids = node?.type === 'dir' ? node.children : [];
        kids.forEach((kid, j) => {
          const branch = j === kids.length - 1 ? '└── ' : '├── ';
          lines.push(text(`${last ? '    ' : '│   '}${branch}${kid}`));
        });
      });
      const dirs = children.filter((n) => isDir(fs, joinPath('~', n))).length;
      lines.push(text(`${dirs} directories`, 'dim'));
      return ok(lines);
    }

    case 'open':
    case 'xdg-open': {
      const arg = target ?? '.';
      const path = resolve(arg, cwd);
      const route = path ? fs[path]?.route : undefined;
      if (path && route && path !== '~') return ok([link('↗ ', `open ${path}`, route)]);
      const bare = arg.replace(/\..*$/, '').replace(/\/$/, '');
      const page = ROUTES.find(
        (r) => r.key === bare || basename(r.file).replace(/\..*$/, '') === bare,
      );
      if (page && arg !== '.') return ok([link('↗ ', `open ${page.file}`, page.href)]);
      return ok([text(`open: nothing to open at ${target ?? cwd} — try: open projects`, 'err')]);
    }

    case 'tail': {
      const journey = fs['~/journey'];
      const names = journey?.type === 'dir' ? [...journey.children].sort() : [];
      const latest = names[names.length - 1];
      const entry = latest ? fs[`~/journey/${latest}`] : undefined;
      if (latest && entry?.type === 'file') {
        return ok([
          text(`==> ~/journey/${latest} <==`, 'dim'),
          ...entry.lines.slice(1),
          link('↗ ', 'open the full journey log', '/journey/'),
        ]);
      }
      return ok([
        text('tail: ~/journey: no entries yet', 'dim'),
        link('↗ ', 'open the full journey log', '/journey/'),
      ]);
    }

    case 'guide':
    case 'tldr':
      return ok([
        text('new to terminals? start with: neofetch → ls → cd projects → cat about.md', 'dim'),
        link('↗ ', 'open the full guide', '/guide/'),
      ]);

    case 'neofetch':
    case 'fastfetch':
      return ok([{ kind: 'neofetch' }]);

    case 'whoami':
      return ok([
        text('guest'),
        text('(the person behind this site: run neofetch or cat about.md)', 'dim'),
      ]);

    case 'history':
      return ok(
        state.history.filter(Boolean).map((h, i) => text(`${`    ${i + 1}`.slice(-5)}  ${h}`)),
      );

    case 'date':
      return ok([text(ctx.now().toString())]);

    case 'echo':
      return ok([text(rest.join(' '))]);

    case 'man':
      return ok([link('↗ ', 'man kushal — open the manual page', '/about/')]);

    case 'clear':
      return { lines: [], cwd, clear: true };

    case 'sudo':
      if ((target ?? '').toLowerCase() === 'hire-me') {
        return ok([
          text("[sudo] access granted. Let's talk:", 'ok'),
          link('  ', ctx.info.email, `mailto:${ctx.info.email}`, true),
        ]);
      }
      return ok([
        text(
          'guest is not in the sudoers file. This incident will be reported. (psst: sudo hire-me)',
          'warn',
        ),
      ]);

    case 'exit':
    case 'logout':
      return ok([
        text('nice try. there is no escape — only ', 'dim'),
        link('', 'the resume', '/resume/'),
      ]);

    case 'contact':
      return ok([
        link('mail  ', ctx.info.email, `mailto:${ctx.info.email}`, true),
        link('gh    ', ctx.info.github.label, ctx.info.github.href, true),
        link('in    ', ctx.info.linkedin.label, ctx.info.linkedin.href, true),
      ]);

    default: {
      const lines = [text(`portfolio-sh: command not found: ${cmd} — try help`, 'err')];
      const guess = suggest(cmd, ALL_COMMANDS);
      if (guess) lines.push(text(`did you mean: ${guess}?`, 'dim'));
      return ok(lines);
    }
  }
}
