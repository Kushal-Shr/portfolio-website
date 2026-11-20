export type Tone = 'fg' | 'dim' | 'dir' | 'warn' | 'err' | 'ok';
export type Segment = { text: string; tone?: Tone; bold?: boolean };

export type Line =
  | { kind: 'text'; segments: Segment[] }
  | { kind: 'link'; prefix?: string; text: string; href: string; external?: boolean }
  | { kind: 'items'; items: Segment[] }
  | { kind: 'neofetch' };

export type FsNode =
  | { type: 'dir'; children: string[]; route?: string }
  | { type: 'file'; lines: Line[]; route?: string };

/** Keys are absolute virtual paths: `~`, `~/projects`, `~/projects/zenith.md`. */
export type VirtualFs = Record<string, FsNode>;

export type ShellState = { cwd: string; prevCwd?: string; history: readonly string[] };

export type ShellInfo = {
  email: string;
  github: { href: string; label: string };
  linkedin: { href: string; label: string };
};

export type ShellContext = { fs: VirtualFs; now: () => Date; info: ShellInfo };

export type ExecResult = { lines: Line[]; cwd: string; clear?: boolean };

export type JourneyEntry = { name: string; lines: Line[] };
