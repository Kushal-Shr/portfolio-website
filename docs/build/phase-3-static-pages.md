# Phase 3: Content pages (about, projects, experience, leadership, resume, dashboard)

> Paste this whole file into a fresh Claude Code session at the repo root.

You are building phase 3 of 10 of Kushal Shrestha's terminal portfolio. Phases 0–2 are done: tooling, design primitives (`TerminalPage`, `Box`, `TypedPrompt`, `NavBar`, `Cursor`) and typed content in `content/`. This phase builds six pages so they match their artboards **exactly** at 1280px. Everything is rendered from `content/`.

## Read first
1. `docs/build/CONTEXT.md`
2. The existing code: `components/terminal/*`, `content/*`, `lib/format.ts`, `lib/routes.ts`. Reuse them; do not re-create primitives.
3. For each page, its artboard (see the table in `design/README.md`). Read the inline styles closely: they hold the exact sizes, gaps, colors and paddings.

## Rules for this phase
- **Server Components only**, except the two client islands named below (the resume print button and the dashboard interactivity).
- All copy comes from `content/`. If you need a string that isn't there, add it to `content/` first.
- Box-drawing and ASCII must render byte-exact: use `<pre>`, don't reformat, and check the alignment visually.
- ASCII art is `aria-hidden="true"`, with the matching `diagramAlt` exposed via a visually hidden `<p>` or `role="img"` + `aria-label` on a wrapper.
- Each page has exactly one `<h1>`.
  - Where the design has no visible title, add a visually hidden one, e.g. "Projects".
  - Where it does (the Man page has NAME and so on as `<h2>`s), make the most natural element the `<h1>`. For the Man page that's a visually hidden "Kushal Shrestha: about".
- Placeholders (`Todo` from content) render as `[text]` in `fg-dim`, matching the design.
- Build a page, then compare it to the artboard, then move on. Take a 1280px Playwright screenshot of each page and look at it before moving on.

## Pages

### 1. `/about`: `Man.dc.html`
- `TerminalPage` with `padX="wide"` (160px sides), prompt `man kushal`, line-height 1.7.
- Header row: `KUSHAL(1)` · `Portfolio Manual` · `KUSHAL(1)` in `fg-dim`, `justify-content: space-between`.
- Sections in order, each `<section>` with an `<h2>` (bold, `fg-bright`, uppercase as in the design) and its body indented `7ch`:
  - **NAME**
  - **SYNOPSIS**: underlined flags from `profile.synopsisFlags`
  - **DESCRIPTION**: `max-width: 72ch`
  - **EXPERIENCE**: each role is a title row (bold org + title, with `formatRange(…, 'years')` right-aligned in dim), plus a summary indented a further 7ch
  - **PROJECTS**: a 22ch / 1fr grid, with bold links to the source and `shortSummary`. List all 5 projects, Sanctuary included
  - **OPTIONS**: derived from skills
  - **EXIT STATUS**: `0      Open to roles in …`, derived from `profile.openTo`
  - **SEE ALSO**: `email(1)`, `github(1)`, `linkedin(1)`, `resume(7)`. Resume is an internal link
- Footer row: `St. Louis, MO` · **build month and year** (e.g. `November 2026`, computed at build time; it's the manual's "last updated") · `1`.

### 2. `/projects`: `Projects.dc.html`
- The design has a 2×2 grid (`gap: 32px 28px`, `padding-top: 8px`) for 4 projects. There are now **5** (Sanctuary was added; see CONTEXT.md).
  - The **featured** card (Rant & Heal) spans the full width on top (`grid-column: 1 / -1`).
  - The other four form the 2×2 below it, in content order.
  - Inside the wide featured card, place the diagram to the right of the summary and bullets (a 2-column inner grid) so it doesn't look stretched. Use `diagramWide` here if it exists.
  - Note this layout change in your report.
- Each project is a `Box` rendered `as="article"`:
  - The title is `{slug}/`. The badge sits on the right: yellow for `highlight`, dim otherwise.
  - The featured project gets `tone="green"` (green border).
- Inside each card (`gap: 12px`):
  - tags line in yellow (`[next.js] [rag] …`)
  - summary
  - the diagram `<pre>` in blue at 13px, `line-height: 1.35`
  - bullets as `- text`, with a dim dash and `fg` text
  - links from `project.links`. Rant & Heal shows `[source]` only, with no `[devpost]`.
  - Sanctuary's `Todo` bullet renders dim in brackets like the other placeholders, and its `team of 4` badge shows on the right.
- Footer line: `5 projects · also: …` from `extraProjects`, then the GitHub link with `github.repoCount` repos, then a `cd ~` link to `/`. The project count must be computed.
- Give each card an `id={slug}` so `/projects/#zenith` deep-links work. The shell and dashboard will use this.

### 3. `/experience`: `Experience.dc.html`
- A caption line: `git log --graph · {n} roles · newest first` (computed).
- Each role is an `<article>` in a flex row:
  - The left rail is 12px wide: a yellow bold `*`, with a 1px `line-strong` vertical line below it. The **last** entry has no line.
  - The body (`gap: 4px`, `padding-bottom: 28px`):
    - `commit {hash}`. The first one also gets a blue bold `(HEAD -> main)`.
    - an `<h2>` at 20px bold: `{title} @ {org}`
    - `Date:   {formatRange arrow}   ·   {location}` in dim
    - bullets in a `<pre>` with `padding-left: 4ch`
    - `stack: …` with the label dim and values `fg`, joined with ` · `
- Footer: `initial commit: Kathmandu, 2023 · see also ~/leadership and resume.txt`. Derive the place and year from the oldest entry.

### 4. `/leadership`: `Leadership.dc.html`
- A real `<table>` with a `<caption>` (left-aligned, dim) and `<thead>`/`<tbody>`.
  - The header row has a green background with dark bold text. Columns: PID, ROLE, ORG, SCOPE, STAT, STATUS. Use `scope="col"` on the `<th>`s.
  - Rows have a `border-bottom: 1px solid line`.
  - Status is green for `running` and dim for `exited`.
- A 2-column grid of impact `Box`es, titled `cat /proc/{pid}/impact`. Only the rows that have impact get a box, as in the design.
- A full-width yellow `Box` titled `ls ~/achievements`: a grid of `22ch 34ch 1fr`, with event bold, award yellow, then the description with an optional `[devpost]` link.

### 5. `/resume`: `Resume.dc.html`
- The button row is centered, with `gap: 16px`:
  - **`wget resume.pdf`** is the primary style (green background, dark bold text, 44px tall). It links to `/resume.pdf` with `download="kushal-shrestha-resume.pdf"`.
    - **Copy `design/source/kushal-shrestha-resume.pdf` to `public/resume.pdf`** (a byte-identical copy). Kushal chose to publish it as-is, even though it contains his phone number. Do not edit or re-render the PDF.
    - Keep a safety net: at build time, check that `public/resume.pdf` exists (`fs.existsSync` in the server component). If it's ever missing, render a non-interactive dim label `wget resume.pdf  (coming soon)` rather than a broken link.
    - Add an E2E check that `/resume.pdf` returns 200 with `application/pdf`.
  - **`lpr resume.txt (print)`**: a client component (`'use client'`, ~10 lines) that calls `window.print()`.
  - **`cd ~`**: a link to `/`.
- **The resume text is generated, not hand-written.** Create `lib/resume.ts` with a pure function `renderResume(content) => ResumeLine[]`:
  - Each line is an array of styled segments (`{ text, tone?, bold?, size? }`), so the `<pre>` can color headings yellow, rules `line-strong` and the name bold at 22px.
  - It builds the exact layout: `=` and `-` rules 78 wide; section headings; entries with **right-aligned dates at column 78** (pad with spaces); bullets as `  - ` wrapped at 78 columns with a 4-space hanging indent; the skills block with a 14-char label column.
  - **Hard rule:** no rendered line exceeds 78 characters. Add a unit test for it.
  - PROJECTS lists only projects with `onResume: true` (the design's four, without Sanctuary), so it still prints on one page.
  - **Fidelity test:** extract the text content of the `<pre>` from `design/artboards/Resume.dc.html` (strip tags, decode entities) and compare it to `renderResume(content)` joined as plain text. They should match line for line.
    - Where they can't, because phase 2 resolved a content inconsistency or the design itself misaligned a column, make the test's expected value explicit and list each difference in your report. Expected differences from phase 2:
      - "Frontend **Software** Engineering Intern" (its date column shifts to stay right-aligned at 78)
      - "three **competition** wins"
      - the full degree name, if phase 2 changed it
- The `<pre>` is centered at `width: 78ch` with `line-height: 1.55`. It ends with the dim `-- EOF --  (78 columns, prints cleanly on one page)` line.
- **Print stylesheet** (in `globals.css`, `@media print`):
  - white background, black text, everything colored becomes black/grey
  - hide the nav, prompt, buttons and skip link
  - `@page { margin: 0.5in }`, resume font-size ~9.5–10pt so 78ch fits the page width
  - links print their URL (the resume already shows them in text)
- **Test that it really prints on one page.** In a Playwright test (Chromium), call `page.emulateMedia({ media: 'print' })`, then `page.pdf({ format: 'Letter' })`, and count the pages in the resulting buffer (count `/Type /Page\b` occurrences). Assert 1.
- Also apply `@media print` basics site-wide: hide the nav, black on white. Other pages may run to several pages.

### 6. `/dashboard`: `Tui.dc.html` (the richest page)
This page has **no** prompt line and uses 14px text. Layout:
- **Header row**:
  - left: `kushal@portfolio ── v1.0`, with `kushal` green and bold
  - right: `St. Louis, MO · CT · ● open to work: …`, with a blinking green `●` and the `openTo` text in yellow
- **Main grid** `280px | minmax(0,1fr) | 380px`, `gap: 22px`:
  - **Left column** (`gap: 22px`):
    - Box `projects`: the project list (all 5, Sanctuary included), interactive, see below. Its last row is a dim `github ({github.repoCount} repos)` that links to GitHub.
    - Box `pages`: `~/about.md`, `~/experience.log`, `~/leadership/`, `~/skills.txt`, `~/resume.txt` and `~/journey/` as **links** to their routes. The design shows them as plain text; links are strictly better here.
    - Box `git log --oneline`, which fills the remaining height: achievements as `* {short-event} {award}` (yellow `*` + event) plus a dim location/year line. Derive it from `achievements.ts`.
  - **Center**: the README pane, a green-bordered `Box` titled `README.md — {slug}`. It shows the **selected** project:
    - an `<h1>`-level heading at 20px bold: a dim `# ` plus the typed project name and a cursor
    - summary
    - a yellow `## architecture`, then `diagramWide ?? diagram` in blue
    - the dim note `[ascii diagrams stand in for screenshots]`
    - a yellow `## what I did`, then the bullets
    - links from `project.links`. For Rant & Heal that's `[source]` only; the design's `[devpost]` is dropped per Kushal
  - **Right column**:
    - Box `whoami`: the ASCII portrait in a 422px-tall `portrait-bg` box (8px font, 9px line-height, `role="img"` with `aria-label="ASCII portrait of Kushal Shrestha"`), then the dim line `$ jp2a me.jpg --width=72` followed by a green status.
    - Box `contact`: a grid of `72px 1fr`. `mail`, `gh` and `in` labels in dim, with links. The email gets `overflow-wrap: anywhere`.
- Nav at the bottom.

**Dashboard interactivity** (one client component, `components/dashboard/Dashboard.tsx` or similar, receiving serialized project data as props from the server page):
- **Project selection.** The list items are `<button>`s using the roving-tabindex pattern:
  - Only the selected one has `tabIndex=0`.
  - ↑/↓ moves the selection and focus, Home/End jump to the ends, and Enter or click selects.
  - The selected row is inverted (green background, dark bold text, `▸ ` prefix). Others get a two-space prefix. Use `aria-pressed` or `aria-current="true"` on the selected one.
  - The default selection is the featured project.
- On selection change:
  - The README pane swaps content, and its title retypes with `useTypewriter` (45ms/char in the design).
  - The pane is an `aria-live="polite"` region, but only the **title** announces, not the whole pane.
  - Update the URL hash (`#zenith`) with `history.replaceState`. On load, select the project from the hash if one is present. This makes `/dashboard/#surgipath` shareable.
- **Portrait reveal:** on mount (unless reduced motion), reveal the portrait one line every 45ms. The status reads `rendering 37%` while revealing, then `✓ done`. The server renders the complete portrait and `✓ done`.
- The server-rendered HTML shows the featured project fully, so no-JS users see a complete page.

## Tests
- **Unit:**
  - `renderResume`: the 78-col rule and the fidelity test
  - date formatting in the man page
  - the dashboard achievements derivation
- **E2E** (`tests/e2e/pages.spec.ts`), for each of the 6 pages:
  - 200 status, one `<h1>`, no console errors, no axe violations
  - key content present (spot-check 2–3 strings per page from `content/`)
- **E2E:** the resume prints to exactly 1 Letter page.
- **E2E (dashboard):**
  - ArrowDown moves the selection and the README title changes.
  - Loading `/dashboard/#zenith` selects zenith.
  - Reduced motion shows the full portrait and title immediately.
- **E2E:** `/projects/#airdesk` scrolls the airdesk card into view.

## Definition of done
- [ ] All six pages match their artboards at 1280px. Compare each Playwright screenshot against the artboard's inline styles and list any intentional deviations.
- [ ] Zero hard-coded facts in `app/` or `components/`. Grep for a few, like "Schnuck" and "Webster", and they should only appear in `content/`.
- [ ] `pnpm check` and `pnpm test:e2e` pass.
- [ ] Client JS is limited to the print button and the dashboard island. Check the `next build` route table: content pages should ship near-zero page-specific JS.

## Finish
- Commit: `feat: about, projects, experience, leadership, resume and dashboard pages`.
- Report:
  - per-page screenshots at 1280px
  - deviations from the design and why
  - the resume fidelity diffs
  - any new `Todo`s
