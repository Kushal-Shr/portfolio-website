# Phase 9: Final review and fixes

> Paste this whole file into a fresh Claude Code session at the repo root.

You are doing the final review of Kushal Shrestha's terminal portfolio. Phases 0–8 are done. Your job is to **find everything that is wrong, inconsistent, fragile or below the bar, then fix it.** Be the most demanding reviewer this project will ever have: a senior frontend engineer, a designer with a pixel ruler and an accessibility specialist in one. Assume bugs exist until you've proven otherwise.

## Read first
1. `docs/build/CONTEXT.md`: the quality bar you're reviewing against.
2. `docs/build/phase-*.md`: what each phase promised. Each "Definition of done" is a checklist to re-verify.
3. `design/README.md` and every artboard.
4. Then the whole codebase.

## Part 1: Audit (write findings down before fixing anything)
Create `reports/final-review.md` (gitignored, or committed if Kushal wants it) with one section per area below. Each finding needs:
- **severity**:
  - `blocker`: broken, inaccessible or embarrassing
  - `major`: noticeably wrong or fragile
  - `minor`: polish
- **where** (`file:line` or route plus viewport)
- **what is wrong**
- **the fix**

### A. Design fidelity (1280px)
For each of the 10 routes, compare the built page against its artboard *property by property*:
- copy (exact wording, punctuation, the `·` and `—` characters)
- colors (token by token)
- font sizes and weights
- line-heights, paddings and gaps
- box titles and badges
- ASCII alignment
- the order of elements

Use Playwright screenshots, plus `getComputedStyle` checks on key elements, and compare them with the artboards' inline styles. List every deviation, and decide whether each is intentional (documented in an earlier report) or a bug.

### B. Content accuracy
- Every fact matches across all views: man page vs experience vs resume vs shell `cat` vs dashboard. Run the shell's `cat` on every file and compare it with the pages.
- `pnpm content:todos`: list what's still a placeholder. Expect at least the Sanctuary contribution bullet and the leadership impact bullets.
- Every fact still matches `design/source/resume.md`: titles, dates, metrics and education. Confirm the agreed changes from the design are applied everywhere: "Frontend Software Engineering Intern", "three competition wins", no Devpost link on the Rant & Heal project card, and Sanctuary present on projects, dashboard, man page and shell, but not in resume.txt.
- **Phone check:** grep `out/` (all HTML, JS and JSON) for the phone number and phone-like patterns. It must appear nowhere except inside `out/resume.pdf`.
- `/resume.pdf` is byte-identical to `design/source/kushal-shrestha-resume.pdf` (compare checksums).
- No invented facts slipped in anywhere. Grep for numbers and dates and trace each to `content/`.
- Spelling and grammar pass over all visible copy.
- Every external link: check each URL in `content/` responds (`curl -sI -L`). LinkedIn often returns 999 to bots; note it as "unverifiable", not broken. List any 404s.

### C. Functionality
- Shell: try to break it. Very long input (5,000 chars), unicode and emoji, only spaces, `cd` chains, `../../..`, Tab spam, ↑ with no history, 300 commands, rapid chip clicks during boot, browser back/forward, a refresh mid-boot, `?run=` with odd input (`%00`, HTML, `<script>`). The output must be rendered as text, never as HTML; check for any `dangerouslySetInnerHTML` outside the sanitized journey body.
- Dashboard: selection, hash deep links, an invalid hash, ↑/↓ at the ends.
- Skills: an invalid `?section=` value. Guide: every example and every "run it" link.
- Journey: empty state, one entry, and many entries (fixtures). Test a date at a month boundary and a far-past entry outside 26 weeks.
- Resume: the PDF button state, print preview (1 page), and the copy button.
- 404 for nested unknown paths (`/projects/nope/`).

### D. Accessibility
Re-run the full phase 7 manual audit: keyboard, VoiceOver, zoom 400%, forced colors, reduced motion, target sizes and contrast. Also confirm that the heading outline of every page makes sense when read alone.

### E. Responsive and cross-browser
- Run the whole e2e suite once in **Firefox and WebKit** too. Add temporary projects if needed, and keep them if they pass reliably.
- Check 320, 390, 768, 1024, 1280 and 1920px, plus landscape phone (844×390).

### F. Performance
- Re-run Lighthouse (phase 8 routes).
- Check that bundle sizes haven't regressed.
- No memory leaks: navigate between pages 30 times and confirm intervals and timeouts are cleaned up. The clock, spinner, typewriter and portrait reveal should each have exactly one live timer. Instrument temporarily if needed.

### G. Code quality
- Dead code, unused exports and unused deps. Check with `pnpm dlx knip`, if it works with the setup.
- Duplication: any copy or logic repeated across components that should come from `content/` or `lib/`.
- `any`, `as` casts, `eslint-disable` and `@ts-expect-error`: justify or remove each one.
- `'use client'` boundaries are as low as possible.
- Hooks follow the rules, effects clean up, and nothing time-based renders differently on the server and the client.
- Naming, file layout and comments match CONTEXT.md conventions.
- Tests: no flaky waits (`waitForTimeout`), meaningful assertions, and the engine and journey math well covered. Run the e2e suite **3 times in a row**; it must be green every time.

### H. Security and privacy basics
- No secrets or `.env` files committed. `.env.example` only.
- Third-party requests: there should be none at runtime. Check the network tab on every route; fonts are self-hosted by `next/font`.
- The email is shown on purpose, which is Kushal's choice. Note it, but don't change it.

## Part 2: Fix
- Fix every **blocker** and **major** finding. Fix **minor** findings when they're quick and safe.
- After each group of fixes, run `pnpm check`. At the end, run `pnpm test:e2e` (all projects) and update the visual baselines **only** for intentional changes, reviewing each diff.
- Don't refactor working code just for taste. Every change must fix a finding.

## Part 3: Launch checklist for Kushal
At the end of `reports/final-review.md`, write a short checklist of what **Kushal** must do before going live:
- remaining content `Todo`s (Sanctuary contribution and hackathon/result, leadership impact bullets, first journey entry, …)
- when the resume changes: replace `design/source/kushal-shrestha-resume.pdf` and update `design/source/resume.md`. Phase 2's cross-check test will flag any content that no longer matches
- GitHub profile tidy-up, so it matches the site recruiters arrive from:
  - the profile location still says "Dallu Awas, Kathmandu"
  - the profile README is a two-liner; link the portfolio there
  - pin rant-and-heal-v2, Zenith, SurgiPath, AirDesk and NLN (Sanctuary)
  - consider giving `rant-and-heal-v2` and `NLN` repo descriptions
- run `pnpm github:sync` right before launch
- set `NEXT_PUBLIC_SITE_URL`
- set `githubRepoUrl`
- pick a host (deployment phase)
- after deploying: test OG previews in the LinkedIn Post Inspector, submit the sitemap in Google Search Console, check the 404 page on the host

## Finish
- Commit the fixes in logical commits: `fix(shell): …`, `fix(a11y): …`, `chore: remove dead code`, and so on.
- Report:
  - the findings table (counts by severity, and which are fixed)
  - anything left unfixed and why
  - the launch checklist
  - your honest assessment of the site's quality, and the 3 highest-impact improvements that remain
