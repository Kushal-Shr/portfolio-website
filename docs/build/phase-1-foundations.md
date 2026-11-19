# Phase 1: Design foundations and shared terminal components

> Paste this whole file into a fresh Claude Code session at the repo root.

You are building phase 1 of 10 of Kushal Shrestha's terminal portfolio. Phase 0 (scaffold, tooling and tests) is done. This phase builds the design system: tokens, fonts, global styles and the shared components every page is made of. At the end, all 10 routes exist as styled shells with working navigation.

## Read first
1. `docs/build/CONTEXT.md`: the brief. Re-read the **Design tokens**, **Recurring patterns** and **Accessibility** sections carefully.
2. `design/README.md`
3. `design/artboards/Nav.dc.html` and `design/artboards/Prompt.dc.html`: the two shared components, which you will build exactly.
4. `design/artboards/Projects.dc.html` and `design/artboards/Man.dc.html`: examples of the page frame and the Box pattern.

## Tasks

### 1. Global styles: `app/globals.css`
- `@import "tailwindcss";` followed by a `@theme` block defining every token from CONTEXT.md as `--color-*` variables:
  - `--color-bg`, `--color-bg-raised`, `--color-fg`, `--color-fg-dim`, `--color-fg-bright: #ffffff` (the man-page headings use white)
  - `--color-line`, `--color-line-strong`
  - `--color-green`, `--color-blue`, `--color-blue-hover`, `--color-yellow`, `--color-red`, `--color-purple`, `--color-portrait-bg`

  This gives utilities like `bg-bg`, `text-fg-dim` and `border-line-strong`.
- `--font-mono` points at the `next/font` CSS variable, with the fallback stack `ui-monospace, Menlo, monospace`.
- Base layer:
  - `html`: `background: var(--color-bg)`, `color-scheme: dark`, `color: var(--color-fg)`, the mono font, `font-size: 15px`, `line-height: 1.6`, `-webkit-text-size-adjust: 100%`, `text-rendering: optimizeLegibility`
  - `body`: `margin: 0`, `min-height: 100dvh`
  - `p, pre, h1, h2, h3, figure`: `margin: 0`. `pre`: `font: inherit`. `h1, h2, h3`: `font-size: inherit` (pages set sizes explicitly)
  - `a`: `color: var(--color-blue)`, `text-underline-offset: 3px`; `a:hover`: `color: var(--color-blue-hover)`
  - `:focus-visible`: `outline: 1px dashed var(--color-green)`, `outline-offset: 2px`. Remove only the default outline that this replaces
  - `::selection`: green background, `bg` text
  - Scrollbars: thin, using `line-strong` on `bg` (`scrollbar-color` / `scrollbar-width`)
- Components layer (small, reusable classes):
  - `.cursor-blink`: `@keyframes blink { 50% { opacity: 0 } }` with `animation: blink 1s steps(1) infinite`
  - `.box-title`: the `┤ title ├` cut-out (absolute position, `bg` background, `padding: 0 6px`)
  - `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important } }`
- **Typewriter flash prevention.** Server HTML must contain the final text (no-JS users and SEO), but we don't want a flash of full text that then gets erased and retyped:
  - Add a tiny inline script in `<head>` (via `app/layout.tsx`) that sets `document.documentElement.classList.add('js')`.
  - CSS: `html.js [data-typing="pending"] { visibility: hidden }`. Once the component mounts it removes the attribute and starts typing.
  - Safety net: `[data-typing="pending"]` also gets `animation: reveal 0s 2.5s forwards` with `@keyframes reveal { to { visibility: visible } }`. If hydration ever fails, the text still appears.
  - Under reduced motion, `[data-typing]` is always visible.

### 2. Root layout: `app/layout.tsx`
- `JetBrains_Mono` from `next/font/google`:
  - weights `400` and `700`, `subsets: ['latin']`, `display: 'swap'`
  - expose the font's CSS `variable` and apply it to `<html>`
- `<html lang="en">`, the `js` class script described above, and a `viewport` export with `themeColor: '#0c0f0d'` and `colorScheme: 'dark'`.
- Base `metadata`: `metadataBase` from `lib/site.ts`, and `title: { default: 'Kushal Shrestha · portfolio-sh', template: '%s · Kushal Shrestha' }`. Phase 8 refines this.
- A skip link as the first element: "skip to content" → `#content`.
  - Visually hidden until focused.
  - When focused it appears top-left in the inverted green style of the Nav's active tab.

### 3. Route table: `lib/routes.ts`
A single typed array that drives the nav, the page prompts and (later) the shell:
```ts
export const ROUTES = [
  { key: 'shell',      href: '/',            label: 'shell',      prompt: null,                                 artboard: 'Main' },
  { key: 'dashboard',  href: '/dashboard/',  label: 'dashboard',  prompt: null,                                 artboard: 'Tui' },
  { key: 'about',      href: '/about/',      label: 'about',      prompt: 'man kushal',                         artboard: 'Man' },
  { key: 'projects',   href: '/projects/',   label: 'projects',   prompt: 'ls -l ~/projects',                   artboard: 'Projects' },
  { key: 'experience', href: '/experience/', label: 'experience', prompt: 'git log --graph ~/experience.log',   artboard: 'Experience' },
  { key: 'leadership', href: '/leadership/', label: 'leadership', prompt: 'ps aux --leadership',                artboard: 'Leadership' },
  { key: 'skills',     href: '/skills/',     label: 'skills',     prompt: 'apt list --installed',               artboard: 'Skills' },
  { key: 'resume',     href: '/resume/',     label: 'resume',     prompt: 'cat resume.txt',                     artboard: 'Resume' },
  { key: 'journey',    href: '/journey/',    label: 'journey',    prompt: 'tail -f ~/journey/log',              artboard: 'Journey' },
  { key: 'guide',      href: '/guide/',      label: 'guide',      prompt: 'tldr portfolio-sh',                  artboard: 'Guide' },
] as const;
```
- Export a `RouteKey` type.
- Export a pure `activeRouteKey(pathname: string): RouteKey`:
  - It handles trailing slashes and nested paths: `/journey/2026-11-19/` → `journey`.
  - Unknown paths → `shell`.

### 4. Hooks: `lib/hooks/`
- `useReducedMotion()`:
  - `useSyncExternalStore` over `matchMedia('(prefers-reduced-motion: reduce)')`.
  - The server snapshot is `true`, so the server never "animates".
- `useInterval(callback, delayMs | null)`:
  - Uses the ref-stored callback pattern; passing `null` pauses it.
  - It also pauses while `document.visibilityState === 'hidden'`, so background tabs don't burn CPU.
- `useTypewriter(text, { speed, startDelay = 0, enabled = true })` returns `{ shown, done, pending }`:
  - Server and first client render: `shown = text`, `done = true`, `pending = true` (pending pairs with `data-typing`).
  - After mount, if `enabled` and motion is allowed: reset to `''`, set `pending = false`, then type one character every `speed` ms.
  - If motion is reduced: `pending = false` and the full text immediately.
  - It restarts when `text` changes.
- `useMounted()`: returns `false` on the server and on the first client render, then `true`.
- Unit-test the pure parts. Test `useTypewriter` with fake timers in happy-dom: it types to completion, skips under reduced motion, and restarts on text change.

### 5. Components: `components/terminal/`
Build each to match the design pixel for pixel at 1280px. Read the inline styles in the artboards for exact values.

- **`Cursor`**: `<span aria-hidden="true" class="cursor-blink text-green">█</span>`. Accepts a className, for example for weight 400 inside a bold heading.
- **`Box`**: the `┤ title ├` panel used on almost every page.
  - Props:
    - `title: string`
    - `badge?: ReactNode` (right-side cut-out)
    - `tone?: 'default' | 'green' | 'yellow'` (border color: `line-strong` / `green` / `yellow`; the title color follows the tone: green for default and green tones, yellow for yellow)
    - `as?: 'section' | 'article' | 'aside' | 'div'`
    - `headingLevel?: 2 | 3` (default 2)
    - `className`, `children`
  - The title renders as a real heading element (`<h2>` by default), so boxes create a correct document outline. The `┤` and `├` glyphs sit in `aria-hidden` spans, so screen readers hear just "projects".
  - Padding defaults to the design's `24px 20px 16px`. Allow it to be overridden.
- **`TypedPrompt`** (client): the Prompt artboard exactly.
  - It is a `<p>` with `min-height: 48px` and flex-centered. Spans, in order:
    - `guest@portfolio` (green)
    - `:` (dim)
    - `{path}` (blue)
    - `$ ` (dim)
    - the typed command (`fg`)
    - `Cursor`
  - Props `cmd` and `path = '~'`. Typing speed is 55ms per char.
  - The `<p>` has `aria-label="guest@portfolio:~$ {cmd}"`. Its visible children are `aria-hidden`, and the typed span carries `data-typing="pending"` until mounted.
  - `white-space: pre` at desktop. Phase 7 handles narrow screens.
- **`NavBar`**: the tmux bar, exactly as in `Nav.dc.html`.
  - `<nav aria-label="Pages">` with a green background, `bg` text, at least 44px tall, `padding: 0 10px`, `gap: 4px`, flex with wrap, font-size 14px, `line-height: 1`.
  - `[kushal]` is bold with `padding-right: 10px`.
  - Each of the 10 routes renders as `{index}:{label}` using `next/link`, with a 44px min height and `padding: 0 10px`.
  - The active route (`usePathname()` → `activeRouteKey`) is inverted: `bg` background, green text, bold, trailing `*`, and `aria-current="page"`.
  - Split it so the bar itself is a Server Component and only the active-state and clock parts are client components. If that complicates things, make the bar a single small client component. It is tiny either way.
  - **Clock** (client, right-aligned with `margin-left: auto`), format `Thu Nov 19 14:05` (`toDateString().slice(0, 10)` plus `HH:MM`):
    - It renders inside a `<time dateTime=…>`.
    - Server and first render output a fixed-width invisible placeholder of the same character count, so there is no layout shift and no hydration mismatch.
    - It updates exactly on minute boundaries: a `setTimeout` to the next minute, then every 60s.
    - Put the formatter in `lib/time.ts` as a pure function `formatClock(date)` and unit-test it.
- **`TerminalPage`**: the page frame every content route uses.
  - Props: `prompt?: string`, `promptPath?: string`, `padX?: 'default' | 'wide'` (the Man page uses 160px side padding), `className`, `children`.
  - Structure:
    - The outer div is `min-h-dvh`, a flex column.
    - Inside, a content column is centered with `max-width: 1280px`, `padding: 24px 24px 0` (or `24px 160px 0` for wide), a flex column with `gap: 24px` and `flex: 1`.
    - `<main id="content" tabIndex={-1}>` wraps the prompt and children.
    - The `NavBar` is full-bleed (edge to edge, not limited to 1280) and pushed to the bottom with `margin-top: auto`. It sits **outside** `<main>`, separated from the content by the column's gap.

### 6. Route stubs
- Create `app/<route>/page.tsx` for all 9 non-home routes, plus update `app/page.tsx`.
- Each stub uses `TerminalPage` with the route's `prompt` from `ROUTES`, and an `<h1>` like `about (coming in phase 3)` styled in `fg-dim`. The home and dashboard stubs have no prompt.
- Give each route a `metadata.title` (`about`, `projects` …).
- This makes the whole site navigable, so you can verify the nav.

## Tests
- **Unit:**
  - `activeRouteKey` (root, each route, trailing and missing slashes, nested journey paths, unknown path)
  - `formatClock`
  - `useTypewriter`
- **E2E** (`tests/e2e/foundation.spec.ts`), for every route in `ROUTES`:
  - status 200
  - exactly one `<h1>`
  - the nav has 10 links
  - exactly one has `aria-current="page"`, and it is the right one
  - no console errors
  - no axe violations
  - no horizontal scroll (desktop and mobile projects)
- **E2E:**
  - Clicking nav links navigates.
  - The skip link is the first Tab stop and moves focus to `#content`.
  - In the `desktop-reduced-motion` project, the prompt's full command is visible immediately.
  - In the `desktop` project, it finishes typing within 2s.
- **E2E**, with JavaScript disabled (`test.use({ javaScriptEnabled: false })`): the prompt's full command text is visible on `/about/`.

## Visual check
Run `pnpm dev`, open `/projects/` at 1280px wide, and compare the prompt line and nav bar against `Prompt.dc.html` and `Nav.dc.html`. Check:
- the green exactly `#7ee787`
- heights 48px and 44px
- the inverted active tab with `*`
- the clock on the right

Take a screenshot with Playwright and look at it.

## Definition of done
- [ ] `pnpm check` and `pnpm test:e2e` pass.
- [ ] No hex colors outside `globals.css`. Check with `grep -rn "#[0-9a-fA-F]\{6\}" app components lib`.
- [ ] No hydration warnings in the dev console on any route.
- [ ] Prompt and nav match the artboards at 1280px.

## Finish
- Commit: `feat: design tokens, terminal primitives, nav and route shells`.
- Report what you built, with screenshots of `/projects/` at 1280px and at 390px (Pixel 7). Note that the mobile layout is not final yet; that is phase 7.
