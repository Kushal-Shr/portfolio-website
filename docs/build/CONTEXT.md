# Project brief: Kushal Shrestha's terminal portfolio

Read this in full before doing any phase's work. It applies to every phase.

## What we're building

This is the personal portfolio of Kushal Shrestha, a CS student at Webster University in St. Louis. Kushal builds data pipelines and AI products and is looking for roles in AI, data, full-stack and DevOps. The whole site behaves like a terminal:
- The home page is a working fake shell (`portfolio-sh`). Visitors can `ls`, `cd`, `cat`, `neofetch`, use Tab completion and ↑/↓ history.
- Every other page is styled as a terminal program: a man page, `git log`, `ps aux`, `apt list` and a TUI dashboard.
- A tmux-style status bar at the bottom of every page links all of them.

The audience is **recruiters and engineers**. The site must be:
- fun for people who know terminals
- **instantly usable for people who don't**: chips, links and the nav bar mean nobody ever *has* to type
- fast, accessible and sharp on a 1280px laptop and a 390px phone

## Design source of truth

- `design/artboards/*.dc.html` holds exact markup, copy, spacing and behavior. Read `design/README.md` to learn how to read the files and which artboard maps to which route.
- **Match the design exactly at 1280px wide**: copy, colors, spacing, font sizes, borders, box-drawing characters, ASCII art and line breaks inside `<pre>`. Where the design and this brief disagree, the brief wins. Where the design is silent (phones, focus states, errors), extend it in the same style.
- Do not "improve" the visual style: no rounded corners, shadows, gradients, emoji, icon libraries, sans-serif fonts or animations beyond those in the design.

## Fact sources and content decisions (Kushal has confirmed these)

- **`design/source/resume.md`** (a transcription of `design/source/kushal-shrestha-resume.pdf`) is the fact source for job titles, dates, metrics, education and skills. If an artboard disagrees on a *fact*, the resume wins. The artboards keep the site's *voice*: shorter, plainer wording.
- **`design/source/github.md`** is the GitHub snapshot: repo count (43), stars and featured repos.
- **Five projects, not four.** The artboards show Rant & Heal, Zenith, SurgiPath and AirDesk. **Sanctuary** (repo `NLN`) is added as a 5th. Its facts come from `github.md`. Kushal's personal contribution is unknown, so it stays a `Todo` until he provides it. Never guess what he built on a team project.
- **Rant & Heal links to its source code only** (`rant-and-heal-v2`): no `[demo]` and no `[devpost]` on the project card, the dashboard or the shell. The Webster Hackfest *achievement* entry keeps its Devpost link, because that documents the hackathon.
- **Resume PDF:** published as-is at `/resume.pdf`, copied from `design/source/kushal-shrestha-resume.pdf`.
- **Phone number:** it appears only inside that PDF. **Never** render it in HTML, the shell, metadata or JSON-LD, and never store it in `content/`.
- **On-resume flag:** the plain-text `resume.txt` view mirrors the design. It includes only projects flagged `onResume` (Rant & Heal, Zenith, SurgiPath, AirDesk). Sanctuary appears everywhere else.

## Design tokens

Define these once as CSS custom properties and Tailwind v4 `@theme` tokens, and use the token names everywhere. Hard-coded hex values outside `globals.css` are a bug.

| Token | Value | Use |
|---|---|---|
| `bg` | `#0c0f0d` | page background; also the "cut-out" behind box titles |
| `bg-raised` | `#121713` | buttons, chips, expanded output |
| `fg` | `#d4dccf` | body text |
| `fg-dim` | `#8a9785` | secondary text, punctuation in prompts |
| `line` | `#2a332b` | subtle dividers, idle button borders |
| `line-strong` | `#3a463b` | box borders, graph lines |
| `green` | `#7ee787` | accent: prompt user, active states, box titles, cursor |
| `blue` | `#79c0ff` | links, directories, ASCII diagrams, cwd in prompt |
| `blue-hover` | `#a5d6ff` | link hover |
| `yellow` | `#e3b341` | headings inside content, commit hashes, tags, warnings |
| `red` | `#ff7b72` | errors, "stuck on" |
| `purple` | `#d2a8ff` | journey tags |
| `portrait-bg` | `#d4dccf` | light box behind the ASCII portrait (text `#0c0f0d`) |

**Typography:**
- JetBrains Mono, weights 400 and 700 only, loaded with `next/font/google`.
- Fallback stack: `ui-monospace, Menlo, monospace`.
- Body text is 15px with line-height 1.6. The dashboard uses 14px and the resume line-height 1.55. Follow each artboard.
- Headings are mostly the body size in bold. Only a few are larger (20–28px), as the artboards show.

**Recurring patterns** (build each once as a component):
- **Box:** a 1px border (`line-strong`, or `green`/`yellow` when highlighted) with the title rendered as `┤ title ├`. The title is absolutely positioned at `top: -11px/-12px; left: 12–14px`, padded `0 6px`, with a `bg` background so it cuts the line. An optional right-side badge sits the same way at `right: 14px`.
- **Prompt line:** `guest@portfolio` (green) `:` (dim) `~` (blue) `$ ` (dim), then the typed command and a blinking `█` (green). The line is 48px tall.
- **Cursor:** the `█` blinks via `@keyframes blink{50%{opacity:0}}` with `animation: blink 1s steps(1) infinite`.
- **Nav (tmux bar):** a green (`#7ee787`) bar, at least 44px tall, with dark text, at the bottom of every page and edge to edge:
  - It reads `[kushal]` (bold), then `0:shell 1:dashboard 2:about 3:projects 4:experience 5:leadership 6:skills 7:resume 8:journey 9:guide`.
  - The active tab is inverted (dark background, green text, bold, trailing `*`) and carries `aria-current="page"`.
  - A live clock on the right shows `Thu Nov 19 14:05`.
- **Page frame:** `padding: 24px 24px 0`, a flex column with `gap: 24px`, and the Nav pinned to the bottom (`margin-top: auto`). Content pages start with the Prompt line, which shows the command that "produced" the page.

## Architecture rules

- **Stack:** Next.js (latest stable, App Router, `output: 'export'`, fully static), TypeScript `strict`, Tailwind CSS v4, pnpm, Vitest, Playwright + `@axe-core/playwright`.
- **No backend.** Nothing may require a server at runtime. Every route must pre-render to HTML in `out/`.
- **One source of truth for content.** Every fact (jobs, projects, skills, links, dates) lives once in `content/*.ts` (journey entries in `content/journey/*.md`). Pages, the shell's virtual filesystem, the resume and the dashboard all *derive* from it. Duplicated copy across files is a bug.
- **Server Components by default.** Add `'use client'` only to the smallest component that needs state, effects or event handlers. Keep client islands small.
- **No hydration mismatches.**
  - Anything time-dependent (clock, "Last login", "today", streak) renders a stable server value. It updates in `useEffect` after mount.
  - Never call `Date.now()`/`new Date()` or `Math.random()` during render in a way that differs between server and client.
- **Progressive enhancement.**
  - With JavaScript disabled every page shows its final content: typed text fully typed, the portrait fully drawn, the skills filter showing everything, and guide outputs readable.
  - Animations start only after hydration.
- **Reduced motion.** When `prefers-reduced-motion: reduce` is set, show final states immediately: no typing, no blinking, no spinner, no line reveal. Use one shared `useReducedMotion` hook plus a CSS media query.
- **Dependencies.** Keep runtime deps minimal. Ask yourself whether 20 lines of code would do before adding a package. No UI kits, icon packs or animation libraries.

## Accessibility rules (non-negotiable)

- Use semantic HTML:
  - one `<h1>` per page (visually it may be small, as in the design)
  - `<nav aria-label="Pages">`, `<main>`, `<article>`, `<section>` with headings, a real `<table>` for `ps aux`
- Interactive things are real `<button>`s, `<a href>`s and `<input>`s with a `<label>`. Never use a clickable `div`.
- Every touch target is at least 44×44px.
- Visible focus: `:focus-visible { outline: 1px dashed var(--green); outline-offset: 2px }`.
- ASCII art and diagrams are `aria-hidden="true"`. Wrap them in an element with `role="img"` and a meaningful `aria-label`, or provide the same information as nearby text.
- Animated text exposes its **final** text to assistive tech (`aria-label` on the container, typed glyphs `aria-hidden`).
- Text contrast is at least 4.5:1 against its background. The token set passes on `bg`; verify any new combination.
- Include a skip link ("skip to content") as the first focusable element.

## Code conventions

- File layout follows the plan:
  - `app/` routes
  - `components/{terminal,shell,skills,guide,journey}/`
  - `lib/` pure logic and hooks
  - `content/` data
  - `scripts/` CLI helpers
  - `tests/{unit,e2e}/`
- Pure logic (shell engine, journey math, path resolution) lives in `lib/`. It has no React imports and is unit-tested.
- Components are small and typed (no `any`), use named exports, and keep props explicit.
- Styling uses Tailwind utilities with the design tokens. Put shared terminal primitives (box title cut-out, blink, `pre` reset) in `globals.css` as small `@layer components` classes. Avoid inline `style` except for values computed at runtime.
- Comments explain *why*, not *what*. No commented-out code.
- Links between pages use `next/link`. External links use plain `<a>` with `rel="noopener noreferrer"` when `target="_blank"`, and they open in the same tab by default.

## Quality bar / definition of done (every phase)

- `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass with **zero** warnings you introduced.
- `pnpm test:e2e` passes for everything built so far.
- The pages you touched match their artboard at 1280px. Open both and compare.
- No console errors or hydration warnings in the browser.
- At the end, report what you built, anything you deviated from and why, and any content questions for Kushal. **Do not invent facts** (metrics, dates, employers, links). Use a clearly marked placeholder and list it in your report.
