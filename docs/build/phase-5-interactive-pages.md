# Phase 5: Skills and Guide pages

> Paste this whole file into a fresh Claude Code session at the repo root.

You are building phase 5 of 10 of Kushal Shrestha's terminal portfolio. Phases 0–4 are done, including the shell engine in `lib/shell/`. This phase builds the two remaining interactive pages:
- **`/skills`**: `apt list --installed`, with a section filter and a "currently installing" spinner.
- **`/guide`**: a friendly "how to use this terminal" page for non-technical visitors, whose example outputs come **from the real shell engine**, so they can never drift out of date.

## Read first
1. `docs/build/CONTEXT.md`
2. `design/artboards/Skills.dc.html` and `design/artboards/Guide.dc.html`, including their script blocks
3. The existing `content/skills.ts`, `content/guide.ts`, `lib/shell/*`, `lib/hooks/*` and `components/terminal/*`

## Page 1: `/skills`

### Layout (match `Skills.dc.html` at 1280px)
- `TerminalPage` with prompt `apt list --installed`.
- **Filter row:** a `role="group"` with `aria-label="Filter by category"`, a dim `--section=` label, then buttons `all`, `languages`, `ai-data` and `cloud`.
  - Each is 44px tall with `padding: 0 16px`.
  - Selected: green background and dark text. Idle: `bg-raised` with a `line` border.
  - Each has `aria-pressed`.
- **A 3-column grid** (`gap: 28px`, `align-items: start`) of `Box`es:
  - `languages & web`, `ai & data`, `cloud, devops & tools`
  - Each package renders as a line: bold `{name}`, dim `/stable`, dim `[installed]`.
  - Then a dim 13px `also used: …` line.
  - All of it derives from `content/skills.ts`. `languages & web` merges the `languages` and `web` lists.
- **A yellow `Box` "currently installing"**:
  - one line per `learning` item: a yellow spinner glyph, `Setting up`, the bold name, and a dim `… {note}`
  - then the dim line `progress gets logged daily in ~/journey`, with `~/journey` linking to `/journey/`

### Behavior (one small client island; the boxes stay server-rendered)
- **Filtering:**
  - The server renders **all** sections visible, so no-JS users see everything.
  - The client island owns the filter state and toggles the `hidden` attribute on sections by `data-section`. It does not re-render them.
  - When one category is selected, the remaining box(es) take the first grid column(s), as in the design.
- **URL sync:**
  - On mount, read `?section=` from `window.location.search` (not `useSearchParams`).
  - On change, update the URL with `history.replaceState`. `?section=all` is omitted.
  - `/skills/?section=cloud` must be shareable.
- **Announce changes:** a visually hidden `aria-live="polite"` region says, e.g., "Showing 8 packages in cloud" or "Showing all 25 packages". The counts are computed.
- **Keyboard:** the buttons are natively focusable, so no extra handling is needed. Enter and Space work.
- **Spinner:**
  - braille frames `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` at 90ms via `useInterval`, which pauses in hidden tabs
  - `aria-hidden`
  - under reduced motion and on the server it shows a static `⠿`

## Page 2: `/guide`

### Layout (match `Guide.dc.html` at 1280px)
- `TerminalPage` with prompt `tldr portfolio-sh`.
- **Intro row**, a grid of `minmax(0,1fr) 420px` with `gap: 32px`:
  - **Left:** an `<h1>` at 28px bold, `portfolio-sh`, followed by a dim regular-weight `— how to get around`. Then two paragraphs (`max-width: 64ch`). "Enter" is green and "shell" links to `/`.
  - **Right:** an `<aside>` yellow `Box` titled `30-second version`: 5 numbered steps with green numbers and green commands.
- **Four section boxes** in a 2-column grid (`gap: 30px 28px`): `start here`, `move around`, `read things` and `shortcuts`. Each item has:
  - a dim `- {what}` line
  - an **expandable example**:
    - **Use native `<details>`/`<summary>`.** It's accessible, keyboard-operable and works without JS.
    - The `<summary>` is styled as the design's button: at least 44px tall, `padding: 0 14px`, `bg-raised`, a `line` border that turns green when `[open]`. Content: dim `$ `, the green command, and a dim hint. Hide the default disclosure marker.
    - The expanded output is a `<pre>`: `margin-left: 2ch`, `padding: 8px 12px`, a 2px green left border, a `bg-raised` background and `white-space: pre-wrap`.
    - Below the output, add a link `▶ run it in the shell` → `/?run={encodeURIComponent(cmd)}`. Phase 4 already supports this. This is the bridge from reading to doing.
- **Tips row**: a 3-column grid with a top border: `~ means home`, `folders end in /` and `.. means up one level`. Titles are yellow bold, bodies dim, with inline commands in `fg`.
- **The easter-egg line**: `psst — a few commands aren't listed here. A recruiter with root access might find one. █`, with a blinking cursor.

### Real outputs from the engine (the key idea)
Add a server-side helper `lib/guide.ts` with `renderGuideExample(cmd, opts)`:
- It builds the virtual fs (same as the home page).
- It runs `exec(cmd, freshState, ctx)`. For commands that need context (e.g. `cd ..` "back to ~"), it first runs setup commands, e.g. `cd projects`.
- It converts the resulting lines to plain styled segments for the `<pre>`.
- Truncate long outputs to the first N lines (the default is 3–4, configurable per item in `content/guide.ts`) and append `…`.
- Special cases:
  - `neofetch`: render a compact text version (the first few info rows, with an `[ascii portrait]` placeholder as in the design), not the portrait.
  - `cd projects`: show `the prompt changes to ~/projects`, plus the "open as a page" link line from the engine.
  - Non-commands (`↑ ↓`, `cd pro` + Tab) keep their static `output` from `content/guide.ts`. For `cd pro`, compute the completion with `complete()` so it's real too.

Add a unit test asserting that every `cmd` in `content/guide.ts` that is a real command runs without producing a `command not found` line. If someone renames a command later, the guide test fails.

## Tests
- **Unit:** guide example rendering (truncation, setup commands, the no-"command not found" check), and the skills counts and merge.
- **E2E (skills):**
  - Clicking `cloud` hides the other two boxes, sets `aria-pressed`, and updates the URL to `?section=cloud`.
  - Loading `/skills/?section=ai-data` pre-selects it.
  - `all` restores everything.
  - The live region text updates.
  - Reduced motion shows a static spinner.
- **E2E (guide):**
  - Clicking a summary opens it and shows the output. The keyboard works too (Tab to it, Enter toggles).
  - The "run it in the shell" link for `tree` lands on `/` and the tree output appears.
  - With JS disabled, the details still open on click. Native details need no JS.
- Both pages: no console errors and no axe violations.

## Definition of done
- [ ] Both pages match their artboards at 1280px. Take screenshots and compare.
- [ ] Guide outputs come from the engine, not from hard-coded strings, except the documented static ones.
- [ ] Skills data comes only from `content/skills.ts`.
- [ ] `pnpm check` and `pnpm test:e2e` pass.

## Finish
- Commit: `feat: skills filter and guide with live engine examples`.
- Report with screenshots: skills filtered to `cloud`, and the guide with two examples open.
