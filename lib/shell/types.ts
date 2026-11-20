export type Tone = 'fg' | 'dim' | 'dir' | 'warn' | 'err' | 'ok';
export type Segment = { text: string; tone?: Tone; bold?: boolean };

export type Line =
  | { kind: 'text'; segments: Segment[] }
  | { kind: 'link'; prefix?: string; text: string; href: string; external?: boolean }
  | { kind: 'items'; items: Segment[] }
  | { kind: 'neofetch' };

/**
 * `route` is the page for this node: a directory's own page, a page file's own page, or (for
 * `README.md` and friends) the page of the directory that holds them. `own` marks files that
 * are themselves pages (`about.md`).
 */
export type FsNode =
  | { type: 'dir'; children: string[]; route?: string }
  | { type: 'file'; lines: Line[]; route?: string; own?: true };

/** Keys are absolute virtual paths: `~`, `~/projects`, `~/projects/zenith.md`. */
export type VirtualFs = Record<string, FsNode>;

export type ShellState = { cwd: string; prevCwd?: string; history: readonly string[] };

export type ShellInfo = {
  email: string;
  github: { href: string; label: string };
  linkedin: { href: string; label: string };
};

export type ShellContext = {
  fs: VirtualFs;
  now: () => Date;
  info: ShellInfo;
  /** `dock` is the docked command line: `neofetch` there navigates home instead. */
  surface?: 'home' | 'dock';
};

/** `navigate` is an href the UI should go to; the engine only ever returns it. */
export type ExecResult = { lines: Line[]; cwd: string; clear?: boolean; navigate?: string };

export type JourneyEntry = { slug: string; title: string; lines: Line[] };
