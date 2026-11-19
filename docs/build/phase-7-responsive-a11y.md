# Phase 7: Responsive layouts and the accessibility pass

> Paste this whole file into a fresh Claude Code session at the repo root.

You are building phase 7 of 10 of Kushal Shrestha's terminal portfolio. Phases 0–6 are done: every page exists and matches its 1280px artboard. The artboards are **fixed-width desktop designs only**, so this phase makes every page excellent on tablets and phones and runs a thorough accessibility audit. Many recruiters will open the link on a phone from LinkedIn or email. The phone experience must feel designed, not squeezed.

## Read first
1. `docs/build/CONTEXT.md`, especially the accessibility rules.
2. Every page component in `app/` and `components/`.
3. The artboards, only to remember the desktop intent. They say nothing about mobile; extend their style.

## Principles
- **The desktop design at ≥1024px must not change.** Every change here sits behind a breakpoint, or is invisible at desktop. Re-run the phase 3–6 desktop screenshots at the end and confirm nothing moved.
- **Breakpoints:** phone `< 640px`, tablet `640–1023px`, desktop `≥ 1024px`. Content stays in the 1280px max container on very wide screens; check 1920px too.
- **Keep the terminal feel on phones.** Monospace stays; boxes, prompts and the tmux bar stay. Reflow; don't reinvent.
- **No page-level horizontal scroll at 320px+.** Only `pre` blocks (ASCII diagrams, the resume, the tree output) and the leadership table may scroll horizontally, each **inside its own container**.
  - Those containers get `overflow-x: auto`, `tabIndex={0}` (keyboard-scrollable; axe's `scrollable-region-focusable` rule), `role="region"` and an `aria-label` ("architecture diagram, scrolls sideways").
  - Add a subtle right-edge fade, shown only when the content actually overflows. Detect it with a ResizeObserver in a tiny shared `ScrollX` component.
- **Type scale on phones:** body 14px. Never go below 12px for real text; the ASCII portrait is exempt because it's an image. The shell input stays **16px** so iOS doesn't zoom on focus.
- **Safe areas:** the full-bleed nav adds `env(safe-area-inset-bottom)` to its bottom padding, and left/right insets in landscape. Use the `viewport-fit=cover` viewport setting.

## Per-component and per-page work

### Shared
- **`TerminalPage`:** padding `24px` on desktop, `16px` sides on phones. The `wide` variant (160px on the Man page) goes 160 → 48 → 16px.
- **`NavBar`:**
  - Phone: a single row that **scrolls horizontally** (no wrap). Use `scroll-snap-type: x proximity` and hide the scrollbar visually but keep it scrollable.
  - On mount, scroll the active tab into view (`scrollIntoView({ inline: 'center', block: 'nearest' })`).
  - Edge fades indicate more tabs.
  - `[kushal]` stays; the clock hides below 640px.
  - Targets stay ≥44px.
  - Tablet: wrapping is fine, if it looks tidy.
- **`TypedPrompt`:** on narrow screens, allow wrapping (`white-space: pre-wrap`, `overflow-wrap: anywhere`) so long commands like `git log --graph ~/experience.log` never overflow.
- **`Box`:** title cut-outs must not collide with the right-side badges on narrow widths. If they would, move the badge inside the box as the first line on phones.

### `/` (shell)
- The terminal fills `100dvh` minus the nav. Use `dvh` so mobile browser chrome doesn't cut it off.
- **The neofetch card stacks on phones:** the portrait goes above the info.
  - **Scale the portrait to fit**: the 72-column ASCII must fit without horizontal scroll at 320px.
  - Compute the font size from the available width (`font-size: min(8px, calc((100vw - 2 * gutter - padding) / (72 * 0.6)))`; adjust the 0.6 glyph-width ratio for JetBrains Mono) and set `line-height` proportionally. Keep the box's aspect ratio.
- The title bar hides `portfolio-sh — 120×40` on phones and keeps the cwd.
- **The chip bar is the primary input on phones.** It becomes a horizontally scrolling single row placed **above** the input line, or sticky at the bottom of the terminal, whichever tests better. Show at least 3 chips without scrolling, with an edge fade.
- **Software keyboard:** when the input focuses on mobile, keep it visible above the keyboard. Use the `visualViewport` resize event to scroll the input into view; test on WebKit. Don't auto-focus on touch (phase 4 already does this; verify it).
- Long output lines (help, `ls -l`, tree) wrap or scroll inside the scrollback, never the page.

### `/dashboard`
- Tablet: two columns (the README pane plus a right column), with the left column's boxes moving into a row above.
- Phone: a single column in this order: header (wrapping), README pane (the selected project), the projects list, whoami (scaled portrait as on the shell), contact, pages, git log.
- On phones, the projects list sits **directly above** the README pane, so the selection → content relationship is obvious. Selecting a project on a phone scrolls the README pane into view.

### `/about` (man page)
- The 7ch indents shrink to 2ch on phones.
- The 22ch/1fr grids (PROJECTS, OPTIONS) stack: the term on its own line, then the description indented 2ch.
- In experience rows, the dates wrap under the title instead of `space-between`.
- The header and footer rows (`KUSHAL(1) … KUSHAL(1)`) hide the middle text on phones, if needed.

### `/projects`, `/skills`, `/guide`
- Grids go 2 or 3 columns → 1 column below 900px. The skills grid goes 3 → 2 → 1.
- The full-width featured project card's inner 2-column layout (text + diagram) stacks below 900px, with the text first and the diagram after.
- ASCII diagrams go in `ScrollX`, as do the guide outputs, if they're wide.
- Filter buttons wrap, and the filter row stays a single focusable group.
- The guide's intro grid (`1fr 420px`) stacks, with the "30-second version" box **first** on phones, because it's the most useful thing there.

### `/experience`
- The rail stays. The `<h2>` drops to 17px. `Date … · location` wraps onto two lines. Bullets wrap with a hanging indent instead of `<pre>` overflow; convert them to a list with `- ` markers via CSS if needed, keeping the look.

### `/leadership`
- The `ps aux` table goes inside `ScrollX`, keeping its tabular look; that suits a terminal. Make sure the header row stays readable.
- The impact boxes stack. The achievements grid (`22ch 34ch 1fr`) becomes stacked blocks: event bold, award yellow, then the description.

### `/resume`
- The 78-col `<pre>` goes inside `ScrollX` on phones, at 12px.
- Show a dim hint above it: `tip: wget resume.pdf for a phone-friendly copy`, only when the PDF exists.
- The buttons row wraps, and buttons stay ≥44px.

### `/journey`
- The 26-week heatmap at 3px letter-spacing is ~26×(1ch+3px). On phones, show the **last 13 weeks** (keep the full grid at ≥640px) and update the box title to `last 13 weeks`. Compute this, rather than hiding it with CSS, so the counts in the screen-reader summary stay right.
- The entry grid (`12ch 1fr`) narrows to `9ch 1fr`. The `── day N ──` rule clips cleanly.

## Accessibility audit (all pages)

### Automated checks
- axe on every route in all 3 Playwright projects, plus a new **`mobile-webkit`** project (`devices['iPhone 13']`; install WebKit for it).
- Add a **320px** viewport project for the no-horizontal-scroll check only.

### Manual checks
Do each one and write the results in your report:
1. **Keyboard only, on each page:**
   - The skip link is the first Tab stop.
   - Focus order is logical.
   - The focus ring is always visible, including on the green nav bar: the dark dashed outline must contrast on green. Add a nav-specific focus style if needed (e.g. a `bg`-colored outline).
   - There are no traps; on the shell, Tab escapes when nothing is left to complete.
   - Every action works: dashboard ↑/↓, skills filter, guide details, journey grid.
2. **Screen reader (VoiceOver on macOS + Safari):**
   - Headings make an outline (rotor).
   - Landmarks: one `main`, one `nav` labeled "Pages". Note that the footer-less design has no `contentinfo`; that's fine.
   - ASCII art is skipped, and its alt text is read.
   - Typed text is read once, in full.
   - The shell announces new output only.
   - The skills live region announces changes.
   - The leadership table reads as a table with headers.
3. **Zoom:** 200% and 400% browser zoom at 1280px (≈ 640px and 320px CSS). Content reflows with no page-level horizontal scroll and nothing clipped (WCAG 1.4.10). Text spacing override (WCAG 1.4.12): apply the bookmarklet styles and confirm nothing overlaps or clips.
4. **Contrast:**
   - Compute the ratio of every text color/background pair actually used: `fg-dim` on `bg-raised`; yellow, red, purple and blue on `bg`; `bg` text on green.
   - **`line-strong` (#3a463b) must never carry meaningful text.** Grep for it and confirm every use is decorative: rules, dots, borders. Make sure decorative glyph rows (resume `====` rules, heatmap dots) are `aria-hidden`.
   - Put the results in a table in your report.
5. **Forced colors** (Windows High Contrast, emulated via Chrome DevTools or Playwright `forcedColors: 'active'`):
   - Box borders and the nav stay visible.
   - The active nav tab is distinguishable (add `@media (forced-colors: active)` rules: an outline on `[aria-current]`, borders using `CanvasText`).
   - The cursor glyph `█` still shows.
6. **Reduced motion:** confirm, page by page, that nothing animates: typing, blink, spinner, portrait reveal, smooth scroll.
7. **Target size:** every interactive element is ≥44×44px (inline text links in paragraphs are exempt). Write an E2E check that measures every `button` and nav `a`.

## Tests to add
- `tests/e2e/responsive.spec.ts`: for every route at 320, 390, 768, 1024 and 1280px:
  - no horizontal page scroll
  - no element overflowing the viewport, except inside `[data-scroll-x]` containers
  - the nav's active tab is in view
- Shell on mobile: tapping a chip runs it; the portrait fits without scrolling.
- Target-size check, focus-visible check (Tab through `/` and `/dashboard/` and assert the focused element has a visible outline style), and the forced-colors smoke test.
- **Visual regression baseline:** Playwright `toHaveScreenshot()` for every route at 1280 and 390, with animations disabled and the clock/dates masked.
  - Commit the baselines. From now on, unintended visual changes fail the suite.
  - Update the baselines deliberately with `--update-snapshots`.

## Definition of done
- [ ] Every page is designed, not squeezed, at 320, 390, 768, 1024, 1280 and 1920px. Include screenshots in your report: a grid of each route at 390 and 768.
- [ ] Desktop at 1280px is pixel-identical to before this phase (compare with the phase 3–6 screenshots).
- [ ] axe is clean in all projects. The manual audit is done, with results written down.
- [ ] `pnpm check` and `pnpm test:e2e` pass, including the new visual baselines.

## Finish
- Commit: `feat: responsive layouts, accessibility audit fixes and visual baselines`.
- Report:
  - the screenshots grid
  - the contrast table
  - manual audit results (pass/fail per check, and what you fixed)
  - anything you couldn't verify (e.g. no real iPhone)
