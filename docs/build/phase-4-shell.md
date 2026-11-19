# Phase 4: The interactive shell (home page)

> Paste this whole file into a fresh Claude Code session at the repo root.

You are building phase 4 of 10 of Kushal Shrestha's terminal portfolio. Phases 0–3 are done: tooling, primitives, content and six content pages. This phase builds the centerpiece, the home page `/`: a working fake terminal called `portfolio-sh`. It is the first thing every recruiter sees, so it must feel **snappy, forgiving and delightful**, and it must never be a barrier: anyone who doesn't want to type can click.

The work splits cleanly in two:
1. **The engine** (`lib/shell/`): pure TypeScript with no React, which turns a command line plus state into output. It is exhaustively unit-tested.
2. **The UI** (`components/shell/`): a client component that renders the engine's output, handles keyboard input and runs the boot sequence.

## Read first
1. `docs/build/CONTEXT.md`
2. `design/artboards/Main.dc.html`, **all of it**. The `<script>` block is the behavior spec: `DIRS`, `PAGE`, `FILES`, `COMMANDS`, `resolve()`, `exec()`, `complete()`, the boot timer, and the key handling for Enter, Tab and ↑/↓. The markup is the visual spec.
3. `design/artboards/Guide.dc.html`: what the guide promises the shell can do. The shell must keep every promise there.
4. The existing `content/*`, `lib/routes.ts`, `lib/hooks/*` and `components/terminal/*`.

## Part 1: The engine (`lib/shell/`)

### Types: `lib/shell/types.ts`
```ts
type Tone = 'fg' | 'dim' | 'dir' | 'warn' | 'err' | 'ok';
type Segment = { text: string; tone?: Tone; bold?: boolean };
type Line =
  | { kind: 'text'; segments: Segment[] }                      // one visual line
  | { kind: 'link'; prefix?: string; text: string; href: string; external?: boolean }
  | { kind: 'items'; items: Segment[] }                         // ls grid
  | { kind: 'neofetch' };                                       // rendered by the UI
type FsNode = { type: 'dir'; children: string[] } | { type: 'file'; lines: Line[]; route?: string };
type VirtualFs = Record<string, FsNode>;   // keys are absolute virtual paths: '~', '~/projects', '~/projects/zenith.md'
type ShellState = { cwd: string; history: string[] };
type ExecResult = { lines: Line[]; cwd: string; clear?: boolean };
type ShellContext = { fs: VirtualFs; now: () => Date };      // injected → deterministic tests
```
Adjust these if you have good reason, but keep the engine serializable and free of React.

### Virtual filesystem: `lib/shell/fs.ts`
`buildVirtualFs(content)` builds the tree **from `content/`**, never from duplicated strings. Mirror the design's `DIRS`/`FILES`:
```
~
├── dashboard/        index.tui
├── about.md
├── projects/         rant-and-heal.md  zenith.md  surgipath.md  airdesk.md  sanctuary.md   (from content/projects, all 5)
├── experience.log
├── leadership/       president.md  senator.md  achievements.md               (from content/leadership + achievements)
├── skills.txt
├── resume.txt
└── journey/          (empty for now; phase 6 fills it from Markdown entries)
```
- File contents follow the design's `FILES` text exactly, generated from content fields. For example, `projects/zenith.md` is:
  - `# zenith (Ghost Visualizer)` (yellow, bold)
  - `shortSummary`
  - `stack: …`
  - `result: …`
- Each dir and file that has its own page carries `route` (from `lib/routes.ts`), so commands can offer "↗ open … as a page".
  - Project files link to `/projects/#slug`.
  - `resume.txt` can reuse `renderResume()` from phase 3, so `cat resume.txt` prints the real resume. That's better than the design's 4-line stub. End it with a `↗ wget resume.pdf` link to `/resume.pdf`.
  - `projects/sanctuary.md` renders its `Todo` bullet as dim `[add: …]`, like the pages do. Rant & Heal shows no Devpost link anywhere in the shell.
  - Never include the phone number in any shell output, including `contact` and `sudo hire-me`.
- **Build the fs on the server.** `app/page.tsx` (a Server Component) calls `buildVirtualFs` and passes it as a prop to the client `<Shell>`, so no content modules or Markdown parsers get bundled into client JS. Keep the serialized fs reasonably small and check its size.
- `buildVirtualFs` accepts a `journeyEntries` argument (default `[]`) so phase 6 can plug in without changing the engine.

### Path resolution: `lib/shell/resolve.ts`
Port `resolve(arg, cwd)`:
- empty or `~` → `~`
- `~/x` is absolute-in-home
- relative paths join to `cwd`
- `.` and `..` are handled, and `..` at `~` stays at `~`
- trailing slashes are ignored
- paths starting with `/` return `null` (outside home → "permission denied")

Also export `isDir`, `isFile` and `basename`.

### Commands: `lib/shell/commands.ts` + `exec.ts`
`exec(input: string, state: ShellState, ctx: ShellContext): ExecResult`.

Tokenize on whitespace; flags are args starting with `-`, and the target is the first non-flag arg. Commands are case-insensitive. Implement **every** command from the design with its **exact** output text:

| Command | Behavior |
|---|---|
| `help` | the design's two-column list, with the command column padded to 34 chars. Add `contact` (see below) |
| `ls [path]`, `ll`, `ls -l` | grid of entries (dirs blue and bold with a trailing `/`); `-l` adds `total N` plus `drwxr-xr-x  guest  staff  name` rows. `ls file` prints the name. Errors: `ls: cannot access 'x': No such file or directory` |
| `cd [path]` | `cd` alone goes to `~`. Into a dir: change cwd and print the "↗ open ~/x as a page" link if it has a route. File: `cd: not a directory: x`. Starting with `/`: `cd: permission denied: x (you live in ~ here)`. Missing: `cd: no such file or directory: x`. Also support `cd -` (previous dir) |
| `pwd` | `/home/guest` + cwd without `~` |
| `cat`/`less`/`more <file>` | file lines, first line yellow (bold if it starts with `#`), then the page link. No arg: dim `usage: cat <file>   (try: cat about.md)`. Dir: `cat: x: Is a directory — try: cd x` |
| `tree` | full tree with `├──`, `└──` and `│` exactly like the design, dirs blue, ending with `N directories` (dim) |
| `open`/`xdg-open <name>` | resolves a path *or* a bare page name (`open skills`, `open resume`, `open dashboard`, `open about`), with extensions optional. Prints the `↗ open ~/x` link. Error: `open: nothing to open at x — try: open projects` |
| `tail [journey]` | the latest journey entry (phase 6). For now: dim `tail: ~/journey: no entries yet`, plus a link to `/journey/` |
| `guide`/`tldr` | the dim hint line plus a "↗ open the full guide" link |
| `neofetch`/`fastfetch` | a `{ kind: 'neofetch' }` line (the UI renders the portrait card) |
| `whoami` | `guest` + the dim hint |
| `history` | numbered (`    1  neofetch`), right-aligned to 5 |
| `date` | `ctx.now().toString()` |
| `echo …` | args joined |
| `man [kushal]` | the "↗ man kushal — open the manual page" link to `/about/` |
| `clear` | `{ clear: true }` |
| `sudo hire-me` | green `[sudo] access granted. Let's talk:` plus the `mailto:` link. Any other `sudo`: yellow `guest is not in the sudoers file. This incident will be reported. (psst: sudo hire-me)` |
| `exit`/`logout` | dim `nice try. there is no escape — only ` plus a link to the resume |
| **`contact`** (new) | email, GitHub and LinkedIn as links. Recruiters will look for it. Add it to `help` |
| unknown | red `portfolio-sh: command not found: x — try help` |
| empty line | just echoes the prompt with no output |

**Typo help:** for unknown commands within edit distance 1–2 of a real one (`sl`, `nefetch`, `cta`), append a dim `did you mean: ls?`. Implement a tiny Levenshtein in `lib/shell/suggest.ts`.

### Completion: `lib/shell/complete.ts`
`complete(input, state, ctx) → { value: string; candidates: string[] }`:
- First word: complete against the command list.
- Later words: complete the last word against the entries of the dir it points into (supporting `projects/ze` → `projects/zenith.md`, and `../`).
- A unique match completes fully: a command gets a trailing space, a dir gets a trailing `/`.
- Multiple matches extend to the **longest common prefix**. If that adds nothing, return the candidates so the UI can print them, as a real shell does on a second Tab.

### Engine tests: `tests/unit/shell/*.test.ts`
These are the most important tests in the project. Use a fixed `now` and a fs built from the real content. Cover:
- every command in the table above, including each error message, verbatim
- path edge cases: `cd ../..`, `cd ~/projects/../leadership`, `cd projects/`, `cd /etc`, `cd about.md`, `cat projects/zenith.md` from `~/leadership`, `ls ..` from a subdir, `cd -`
- case-insensitivity (`LS`, `Neofetch`)
- completion: `ne` → `neofetch `, `cd pro` → `cd projects/`, `cat projects/ze` → `cat projects/zenith.md`, `c` → candidates `cat`, `cd`, `clear`, `contact`
- typo suggestions
- `tree` output, compared to an inline snapshot

## Part 2: The UI (`components/shell/`)

### Layout (match `Main.dc.html` at 1280px)
- The page frame is `padding: 24px 24px 0` with the Nav at the bottom. The terminal window fills the remaining viewport height (`flex: 1; min-height: 0`), so the page itself never scrolls on desktop; the output scrolls inside.
- The terminal window has a `1px line` border:
  - **Title bar:** `guest@portfolio: {cwd}` on the left and `portfolio-sh — 120×40` on the right, dim at 13px, with a bottom border.
  - **Scrollback** (`padding: 20px 24px`, `overflow-y: auto`, `gap: 14px`). It's anchored to the bottom like a real terminal; the design uses `flex-direction: column-reverse`. Its contents:
    1. the "hello" ASCII banner (accent green, `line-height: 1.2`, `aria-hidden`)
    2. `Last login: {date} on ttys001`, dim. The date fills in on the client after mount
    3. **the intro `<h1>`**, typed: "Hi, I'm Kushal Shrestha — I build …" with a cursor while typing
    4. the history entries: each is an echoed prompt line plus its output lines
    5. after boot, the dim hint line `it's a real-ish shell: try ls, cd projects, cat about.md, tree or help · Tab completes · ↑ recalls · new to terminals? read the guide`. Commands are green and "read the guide" links to `/guide/`
    6. the **input line**: a `<label for="cmd">` containing the prompt (`guest@portfolio`:`{cwd}`$) and an `<input id="cmd">`. The input is transparent, inherits the font, and has a green caret
  - **Chip bar** at the bottom (border-top): a dim `run:` label and buttons `neofetch`, `ls`, `cd projects`, `cat about.md`, `tree`, `tail journey`, `help`, `guide`, `contact`. They are 44px tall with a `bg-raised` background and `line` border at 13px. Clicking one runs it as if typed (echo + output) and returns focus to the input.
- **Output line rendering** (`OutputLine.tsx`): text lines use `white-space: pre-wrap` with `padding-left: 16px`. Tones map to tokens. Links use `next/link` for internal routes and `<a>` for external links and `mailto:`. Items render as a wrapping flex row with `column-gap: 28px`.
- **Neofetch card** (`Neofetch.tsx`):
  - The portrait sits in a 362×422 `portrait-bg` box at 8px/9px, `role="img"`.
  - To its right: `guest@portfolio`, a dim rule, the `profile.neofetch` rows (key in bold accent, value in `fg`), then the 6 color blocks (`███` in red, yellow, green, blue, purple, fg).
  - The portrait reveals 2 lines per 30ms the first time it appears.

### Behavior
- **State:** `{ cwd, prevCwd, entries: { id, cwd, input, lines }[], draft, recallIndex }`. The engine's `history` is derived from the entries.
- **Boot sequence**, ported from the design's timer (default `typeSpeed` 38ms):
  1. Type the intro one char per tick.
  2. Pause 14 ticks.
  3. Type `neofetch` into the input, one char every 3 ticks.
  4. Run it at tick 46 of the pause.
  5. Reveal the portrait.

  Rules for the boot:
  - **Any interaction skips the boot instantly**: a keystroke in the input, clicking a chip, or clicking a link. The intro completes, the boot draft clears, and the user's action proceeds.
  - **Only animate once per browser session.** Set `sessionStorage['psh:booted']`. On later visits in the same session, render the final booted state immediately.
  - Under **reduced motion**: no typing; show the intro, the neofetch output and the full portrait immediately.
  - **Server render / no JS:** the final booted state (intro, the `neofetch` entry with the full portrait, the hint line). The input is disabled, and a `<noscript>` note says the nav bar below works without JavaScript.
- **Persist the session.** Save `entries` (capped at 100), `cwd` and `prevCwd` to `sessionStorage`. Navigating to `/projects/` and back restores the terminal exactly. Wrap every storage access in try/catch.
- **Keyboard**, on the input:
  - **Enter:** run the command.
  - **Tab:** complete.
    - A unique completion or common prefix replaces the draft.
    - On no progress, a second consecutive Tab prints the candidates as an output block, *without* adding a history entry. Show the prompt plus draft again, like bash does.
    - **Accessibility exception:** if the draft is empty, or completion yields nothing at all, **let Tab move focus normally** (don't `preventDefault`). Never trap keyboard users. Shift+Tab is always native.
  - **↑/↓:** recall history exactly as in the design. ↓ past the newest returns to an empty draft.
  - **Ctrl+L:** clear.
  - **Ctrl+C:** echo the current line with `^C` appended, then clear the draft.
  - **Ctrl+U:** clear the draft.
  - **Escape:** clear the draft.
- **Focus:**
  - Auto-focus the input after boot **only on fine-pointer devices** (`matchMedia('(pointer: fine)')`). On phones, auto-focus pops the keyboard over the content.
  - Clicking anywhere in the scrollback focuses the input, **unless** the user is selecting text (`getSelection().toString()` is non-empty) or clicked a link or button.
- **Scrolling:** after each command, keep the newest output in view. If the user has scrolled up to read, don't yank them down until they run the next command.
- **`?run=` deep links:** on mount, read `new URLSearchParams(location.search).get('run')`.
  - If present (trim it, cap at 100 chars), skip the boot and run that command as if typed.
  - Then strip the param with `history.replaceState`.
  - Phase 5's guide links use this (`/?run=tree`), and so can Kushal, e.g. `/?run=sudo%20hire-me` in an email.
  - Read the param from `window.location` in an effect, **not** via `useSearchParams` (that would force a Suspense boundary and client-only rendering under static export).
- **Input attributes:** `autoComplete="off"`, `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`, `enterKeyHint="go"`, and `aria-describedby` pointing at the hint line.
- **Accessibility:**
  - The scrollback list is `role="log"` with `aria-live="polite"` and `aria-relevant="additions"`. New output gets announced; old output doesn't re-announce.
  - The boot animation's glyphs are `aria-hidden`, and the `<h1>` has the full intro as its `aria-label`.
  - The ASCII banner and color blocks are `aria-hidden`.
- **Performance:** typing must stay instant with 100 entries in scrollback. Memoize entry rendering (`React.memo` keyed by entry id) so a keystroke doesn't re-render old output.

## E2E tests: `tests/e2e/shell.spec.ts`
- The boot completes and the neofetch card appears (desktop project); with reduced motion it's immediate.
- Typing in the input during boot skips it immediately.
- Each scenario below works:
  - `ls` shows `projects/` styled as a dir.
  - `cd projects` then `pwd` → `/home/guest/projects`, and the title bar shows `~/projects`.
  - `cat zenith.md` shows `# zenith (Ghost Visualizer)` and a link to `/projects/#zenith`.
  - `sudo hire-me` shows a `mailto:` link.
  - `foo` shows command not found.
  - `sl` suggests `ls`.
- Tab: `cd pro` + Tab → `cd projects/`. With an empty input, Tab moves focus out of the input (the next focusable element gets focus).
- ↑ recalls the previous command, ↓ returns to empty.
- Ctrl+L clears.
- Chips: clicking `tree` prints the tree, and focus returns to the input.
- Persistence: run `cd projects`, navigate to `/about/` via the nav, go back, and the history plus cwd are restored.
- `/?run=tree` runs tree, and the URL no longer contains `run=`.
- No-JS: `/` shows the intro text and the neofetch info (name, role).
- No console errors and no axe violations, including after running several commands.

## Definition of done
- [ ] The engine has no React imports, and its tests cover every command and error string.
- [ ] Every command and promise in `Guide.dc.html` works in the shell.
- [ ] At 1280px the page matches `Main.dc.html`: border, title bar, banner, prompt colors, chip bar, neofetch layout.
- [ ] Typing feels instant, the boot never blocks the user, and keyboard users are never trapped.
- [ ] `pnpm check` and `pnpm test:e2e` pass. Check the client JS for `/` in the build output; the shell route should stay lean (no content/Markdown libraries bundled).

## Finish
- Commit: `feat: portfolio-sh interactive shell with engine, completion and boot sequence`.
- Report:
  - screenshots (boot mid-way, after `neofetch`, after `tree`, after `cat zenith.md`)
  - the JS size of `/`
  - any design behaviors you changed and why
