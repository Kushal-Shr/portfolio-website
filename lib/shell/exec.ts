import { ALL_COMMANDS } from './commands';
import { easterEgg } from './eggs';
import { link, seg, text } from './lines';
import { basename, isDir, isFile, joinPath, resolve } from './resolve';
import { suggest } from './suggest';
import type { ExecResult, Line, Segment, ShellContext, ShellState, VirtualFs } from './types';

const HELP: readonly (readonly [string, string])[] = [
  ['ls [dir]', 'list files (-l for details)'],
  ['cd <dir>', 'move around: every folder is a page'],
  ['cat <file>', 'read a file: cat about.md'],
  ['tree', 'the whole site at a glance'],
  ['open <page>', 'jump to any page: open zenith'],
  ['tail journey', "today's entry in the daily log"],
  ['neofetch', 'who I am, with a picture'],
  ['contact', 'email, GitHub and LinkedIn'],
  ['guide', 'step-by-step how-to, with examples'],
  ['pwd · history · date · clear', ''],
];

const DEFAULT_TREE_DEPTH = 2;

const entryName = (fs: VirtualFs, dir: string, name: string): Segment =>
  isDir(fs, joinPath(dir, name)) ? seg(`${name}/`, 'dir', true) : seg(name);

/** A page's own path: `README.md` and friends belong to their folder's page. */
function pagePath(fs: VirtualFs, path: string): string {
  const node = fs[path];
  return node?.type === 'file' && !node.own ? path.slice(0, path.lastIndexOf('/')) : path;
}

/**
 * The page file a path names, if any: `~/about.md` itself, or `~/about` with its extension left
 * off. Plain files such as `README.md` are not pages.
 */
function pageFile(fs: VirtualFs, path: string): string | undefined {
  const isPage = (p: string) => {
    const node = fs[p];
    return node?.type === 'file' && node.own === true;
  };
  if (isPage(path)) return path;
  const folder = path.slice(0, path.lastIndexOf('/')) || '~';
  const dir = fs[folder];
  if (dir?.type !== 'dir') return undefined;
  const name = basename(path).toLowerCase();
  const hit = dir.children.find(
    (c) => c.replace(/\.[a-z]+$/i, '').toLowerCase() === name && isPage(joinPath(folder, c)),
  );
  return hit ? joinPath(folder, hit) : undefined;
}

/** The "↗ open … as a page" link for a path that has a page. */
function pageLink(ctx: ShellContext, path: string): Line[] {
  const route = ctx.fs[path]?.route;
  return route ? [link('↗ ', `open ${pagePath(ctx.fs, path)} as a page`, route)] : [];
}

/**
 * A folder's children as `ls` and `tree` show them: a capped folder (the journey) keeps only its
 * first `cap.dirs` subfolders and reports the rest as `… N <hint>`.
 */
function listing(fs: VirtualFs, path: string): { names: string[]; more?: string } {
  const node = fs[path];
  if (node?.type !== 'dir') return { names: [] };
  if (!node.cap) return { names: node.children };
  const dirs = node.children.filter((c) => isDir(fs, joinPath(path, c)));
  const hidden = dirs.length - node.cap.dirs;
  if (hidden <= 0) return { names: node.children };
  const shown = new Set(dirs.slice(0, node.cap.dirs));
  return {
    names: node.children.filter((c) => shown.has(c) || !isDir(fs, joinPath(path, c))),
    more: `… ${hidden} ${node.cap.hint}`,
  };
}

const JOURNEY_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `tree` lines for `root`, down to `depth` levels, plus the directory and file counts. */
function treeLines(fs: VirtualFs, root: string, depth: number): Line[] {
  const lines: Line[] = [text(root, 'dir', true)];
  let dirs = 0;
  let files = 0;
  const walk = (path: string, prefix: string, level: number) => {
    if (level > depth) return;
    const { names, more } = listing(fs, path);
    const kids = names.map((c) => joinPath(path, c));
    kids.forEach((kid, i) => {
      const last = i === kids.length - 1 && !more;
      const d = isDir(fs, kid);
      if (d) dirs += 1;
      else files += 1;
      const name = basename(kid);
      lines.push(
        text(
          `${prefix}${last ? '└── ' : '├── '}${d ? `${name}/` : name}`,
          d ? 'dir' : undefined,
          d,
        ),
      );
      if (d) walk(kid, `${prefix}${last ? '    ' : '│   '}`, level + 1);
    });
    if (more) lines.push(text(`${prefix}└── ${more}`, 'dim'));
  };
  walk(root, '', 1);
  lines.push(text(`${dirs} directories, ${files} files`, 'dim'));
  return lines;
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
  const ok = (lines: Line[], nextCwd = cwd, navigate?: string): ExecResult => ({
    lines,
    cwd: nextCwd,
    ...(navigate ? { navigate } : {}),
  });

  switch (cmd) {
    case '':
      return ok([]);

    case 'help':
      return ok(
        HELP.map(([name, what]) => text(what ? `  ${name}`.padEnd(34) + what : `  ${name}`)),
      );

    case 'ls':
    case 'll': {
      // No argument means "here", not home (`resolve` maps an empty path to `~`).
      const path = target === undefined ? cwd : resolve(target, cwd);
      if (path && isFile(fs, path)) return ok([text(target ?? '')]);
      const node = path ? fs[path] : undefined;
      if (!path || node?.type !== 'dir') {
        return ok([text(`ls: cannot access '${target}': No such file or directory`, 'err')]);
      }
      const { names, more } = listing(fs, path);
      const tail = more ? [text(more, 'dim')] : [];
      if (flags.includes('l') || cmd === 'll') {
        return ok([
          text(`total ${node.children.length}`, 'dim'),
          ...names.map((name): Line => {
            const child = joinPath(path, name);
            const d = isDir(fs, child);
            const childNode = fs[child];
            const route =
              d || (childNode?.type === 'file' && childNode.own) ? childNode?.route : undefined;
            const row = `${d ? 'drwxr-xr-x' : '-rw-r--r--'}  guest  staff  ${d ? `${name}/` : name}`;
            const segments: Segment[] = [seg(row, d ? 'dir' : undefined, d)];
            if (route) segments.push(seg(`    ${route}`, 'dim'));
            return { kind: 'text', segments };
          }),
          ...tail,
        ]);
      }
      return ok([{ kind: 'items', items: names.map((n) => entryName(fs, path, n)) }, ...tail]);
    }

    case 'cd': {
      const arg = rest[0];
      if (arg === '-') {
        const prev = state.prevCwd ?? cwd;
        return ok([text(prev, 'dim')], prev, fs[prev]?.route);
      }
      const path = resolve(arg, cwd);
      if (path && isDir(fs, path)) return ok([], path, fs[path]?.route);
      // About, resume and guide are pages that live as files in `~`, but the nav bar calls them
      // pages, so `cd about` opens them; the cwd stays the file's folder to keep matching the URL.
      const page = path ? pageFile(fs, path) : undefined;
      if (page) {
        const route = fs[page]?.route ?? '/';
        const folder = page.slice(0, page.lastIndexOf('/')) || '~';
        return ok(
          [link('↗ ', `${basename(page)} is a page, not a folder — opening it`, route)],
          folder,
          route,
        );
      }
      if (path && isFile(fs, path)) {
        return ok([text(`cd: not a directory: ${arg}`, 'err')]);
      }
      if (!path) return ok([text(`cd: permission denied: ${arg} (you live in ~ here)`, 'err')]);
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
        const readme = fs[joinPath(path, 'README.md')];
        if (readme?.type === 'file') {
          const name = basename(path);
          return ok([
            text(`(${name}/ is a folder — showing ${name}/README.md)`, 'dim'),
            ...readme.lines,
            ...pageLink(ctx, path),
          ]);
        }
        return ok([text(`cat: ${target}: Is a directory — try: cd ${target}`, 'err')]);
      }
      return ok([text(`cat: ${target}: No such file or directory`, 'err')]);
    }

    case 'tree': {
      let depth = DEFAULT_TREE_DEPTH;
      let arg: string | undefined;
      for (let i = 0; i < rest.length; i++) {
        const a = rest[i] ?? '';
        if (a === '-L') depth = Number(rest[++i]) || DEFAULT_TREE_DEPTH;
        else if (/^-L\d+$/.test(a)) depth = Number(a.slice(2));
        else if (!a.startsWith('-')) arg = a;
      }
      const path = arg === undefined ? cwd : resolve(arg, cwd);
      if (!path || !isDir(fs, path)) return ok([text(`${arg ?? ''} [error opening dir]`, 'err')]);
      return ok(treeLines(fs, path, depth));
    }

    case 'open':
    case 'xdg-open': {
      if (!target) {
        const route = cwd === '~' ? undefined : fs[cwd]?.route;
        if (!route)
          return ok([text(`open: nothing to open at ${cwd} — try: open projects`, 'err')]);
        return ok([link('↗ ', `opening ${cwd}`, route)], cwd, route);
      }
      const path = resolve(target, cwd);
      const route = path ? fs[path]?.route : undefined;
      if (path && route) return ok([link('↗ ', `opening ${path}`, route)], cwd, route);

      // Name fallback: `open zenith` or `open python` from anywhere.
      const needle = target
        .replace(/\/$/, '')
        .replace(/\.[a-z]+$/i, '')
        .toLowerCase();
      const hits = Object.entries(fs)
        .filter(([p, n]) => p !== '~' && (n.type === 'dir' || n.own))
        .filter(
          ([p]) =>
            basename(p)
              .replace(/\.[a-z]+$/i, '')
              .toLowerCase() === needle,
        )
        .map(([p]) => p);
      if (hits.length === 1) {
        const only = hits[0] ?? '';
        const href = fs[only]?.route;
        return ok([link('↗ ', `opening ${only}`, href ?? '/')], cwd, href);
      }
      if (hits.length > 1) {
        return ok([
          text(`open: ${hits.length} matches for ${target} — be specific:`, 'dim'),
          { kind: 'items', items: hits.map((h) => seg(h)) },
        ]);
      }
      return ok([text(`open: nothing to open at ${target} — try: open projects`, 'err')]);
    }

    case 'tail': {
      const journey = fs['~/journey'];
      const slugs =
        journey?.type === 'dir' ? journey.children.filter((c) => JOURNEY_DATE.test(c)).sort() : [];
      const latest = slugs[slugs.length - 1];
      const entry = latest ? fs[`~/journey/${latest}/README.md`] : undefined;
      if (latest && entry?.type === 'file') {
        return ok([
          text(`==> ~/journey/${latest}/README.md <==`, 'dim'),
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
      // The portrait needs the full shell, so the dock sends you home to see it.
      if (ctx.surface === 'dock') return ok([], cwd, '/?run=neofetch');
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
        link('mail      ', ctx.info.email, `mailto:${ctx.info.email}`, true, ctx.info.email),
        link('github    ', ctx.info.github.label, ctx.info.github.href, true),
        link('linkedin  ', ctx.info.linkedin.label, ctx.info.linkedin.href, true),
      ]);

    default: {
      const egg = easterEgg(cmd, rest, ctx);
      if (egg) return ok(egg);
      const lines = [text(`portfolio-sh: command not found: ${cmd} — try help`, 'err')];
      const guess = suggest(cmd, ALL_COMMANDS);
      if (guess) lines.push(text(`did you mean: ${guess}?`, 'dim'));
      return ok(lines);
    }
  }
}
