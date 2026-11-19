# Phase 8: Polish (SEO, social previews, 404, performance, delight)

> Paste this whole file into a fresh Claude Code session at the repo root.

You are building phase 8 of 10 of Kushal Shrestha's terminal portfolio. Phases 0–7 are done: every page is built, responsive and accessible. This phase is the polish that separates a good portfolio from a memorable one:
- how the link *looks* when shared on LinkedIn or Slack
- how it ranks when someone googles Kushal
- how fast it loads
- the small details people screenshot

## Read first
1. `docs/build/CONTEXT.md`
2. `app/layout.tsx`, every `app/**/page.tsx`, `lib/site.ts`, `lib/routes.ts` and `content/profile.ts`
3. The installed Next.js version's docs for the Metadata API, `opengraph-image`, `icon`, `sitemap` and `robots`, as they work **under `output: 'export'`**. Verify each one actually emits a static file in `out/`.

## 1. Metadata and SEO
- **Root metadata** (`app/layout.tsx`):
  - `metadataBase` from `siteUrl`
  - `title` template `%s · Kushal Shrestha`, default `Kushal Shrestha · data & AI engineer in the making`. Refine the wording from `content/profile.ts` and don't overclaim.
  - `description` (≤155 chars) from the profile
  - `authors`, `creator`, `keywords` (sparingly)
  - `openGraph` (type `website`, `siteName`, locale `en_US`) and `twitter` (`summary_large_image`)
  - `alternates.canonical`, plus the RSS alternate from phase 6
  - `robots: { index: true, follow: true }`
  - `formatDetection: { telephone: false }`
- **Per-route** `metadata` or `generateMetadata`. Each route gets a unique, human `title` and `description` written for a recruiter scanning search results. For example:
  - `/projects/`: title "projects", description "Rant & Heal (Hackfest 2025 Best Overall), Zenith VS Code extension, SurgiPath and AirDesk. Built by Kushal Shrestha."
  - Pull the facts from content. Don't hand-type them.
- **Structured data:** JSON-LD `Person` on `/` and `/about/`:
  - `name`, `url`, `jobTitle` (honest: "Computer Science student", or a student/intern framing), `alumniOf`/`affiliation` (Webster University), `address` locality
  - `sameAs` (GitHub, LinkedIn) and `knowsAbout` (from skills)
  - `email` is fine. **No `telephone`.** The phone number stays inside the PDF only.
  - Render it as `<script type="application/ld+json">` from a typed helper. Escape `<` in the JSON.
- `app/sitemap.ts` and `app/robots.ts` with `export const dynamic = 'force-static'`:
  - The sitemap includes every route plus every journey permalink, with `lastModified` (build date, or the entry date for journey pages).
  - Robots allows all and points to the sitemap.
  - Confirm `out/sitemap.xml` and `out/robots.txt` exist after building.

## 2. Social preview image
- `app/opengraph-image.tsx`, 1200×630, statically generated at build time.
  - **Content:** a terminal window on `#0c0f0d` with a `1px #2a332b` border.
  - At the top, the prompt line `guest@portfolio:~$ neofetch`.
  - Then a neofetch-style block: a small version of the ASCII portrait on the left (`portrait-bg` box), and on the right `Kushal Shrestha` large in green bold, `CS student · data & AI`, `St. Louis, MO`, and `open to: AI · data · full-stack · devops` in yellow.
  - The green tmux bar runs along the bottom: `[kushal] 0:shell* 1:dashboard …`.
- **Font:** `ImageResponse` needs font data. Vendor JetBrains Mono Regular and Bold TTFs (OFL-licensed) into `assets/fonts/`, include the license file, and load them with `fs.readFile` at build time. Do not fetch from the network during the build.
- Also add **per-section OG images** for `/projects/`, `/journey/` and `/resume/`, each with its own prompt command and a one-line summary. Use a shared `OgFrame` helper so the four images stay consistent.
- Check the result: open the generated PNGs and look at them. They must be crisp, legible at thumbnail size (LinkedIn shows ~520px wide) and on-brand.
- If `opengraph-image.tsx` doesn't work under static export in this Next version, generate the PNGs in a `prebuild` script with `satori` + `@resvg/resvg-js` into `public/og/`, and reference them in the metadata.

## 3. Icons
- `app/icon.svg`: a `>_` glyph in green on `#0c0f0d`, with rounded-square-free sharp corners. It must look good at 16px; test it.
- `app/apple-icon.png` (180×180) and a 512px PNG for the manifest.
- `app/manifest.ts` (static): name, short_name `kushal`, `theme_color`/`background_color` `#0c0f0d`, `display: 'browser'`, and the icons.

## 4. 404: `app/not-found.tsx`
- It uses `TerminalPage`, with no prompt from `ROUTES`. Instead, a client island reads `window.location.pathname` after mount. The server renders a generic path.
- Output, styled like shell output:
  ```
  guest@portfolio:~$ cd /that/path
  portfolio-sh: no such file or directory: /that/path
  ```
  Then a dim `did you mean:` with the closest route by edit distance, as a link (reuse `lib/shell/suggest.ts`). Then a list of all pages as links, `ls ~` style.
  - The first line is the `<h1>`, visually styled as the prompt.
- Confirm that `out/404.html` is generated and renders correctly when served (`serve` uses it for unknown paths).

## 5. Shell delights (tasteful, unlisted, small)
The guide promises "a few commands aren't listed here". `sudo hire-me` is one; add **a few** more to the engine, with unit tests. Keep them short and witty, never cringe, and none in `help`:
- `rm …`: `rm: cannot remove '…': this portfolio is read-only (but my calendar isn't: sudo hire-me)`
- `vim`/`vi`/`nano`/`emacs`: `{editor}: not installed. the only editor here is reality. try: cat about.md`
- `git log`: a short `--oneline` of real milestones derived from content (experience starts, hackathon wins)
- `git` alone: links to GitHub
- `ping kushal`: `PONG — usually replies within a day:` + the mailto link
- `cowsay <text>`: an ASCII cow saying the text. Implement it in ~15 lines; no dependency.
- `matrix`, `hack`: `access denied. nice try, though.`

Add them to the `COMMANDS` list so Tab completion knows them. A user who finds them by Tab is rewarded.

## 6. Performance
Targets: Lighthouse **≥ 95 in Performance, Accessibility, Best Practices and SEO** on every route, mobile and desktop.
- Measure: `pnpm build && pnpm serve`, then run Lighthouse via `pnpm dlx lighthouse http://localhost:4173/<route> --preset=desktop` (and the default mobile preset) for at least `/`, `/projects/`, `/resume/` and `/journey/`. Save the JSON reports to `reports/lighthouse/` (gitignored) and summarize the scores.
- **JavaScript:** read the `next build` route-size table.
  - Content pages (about, experience, leadership, resume, projects) should ship only the shared framework chunk plus the nav island.
  - Find and remove any accidental client boundaries: a `'use client'` too high up, or content modules or `remark` pulled into client bundles. Use `@next/bundle-analyzer` temporarily if anything looks heavy.
- **Fonts:** only two weights, latin subset, `display: swap`, preloaded by `next/font`. No layout shift on font swap: `next/font`'s size-adjusted fallback handles it, but verify CLS = 0.
- **CLS = 0** everywhere: the clock has reserved width, the typed text has reserved space (`data-typing` keeps layout because it's `visibility: hidden`, not removed), and the portrait box has fixed dimensions.
- **No render-blocking extras.** The only inline script is the tiny `js` class script.
- **Long scrollback:** run 200 commands in the shell via a quick Playwright loop and confirm input latency stays < 50ms (measure with `performance.now()` around a keystroke-to-paint, or use the trace).

## 7. Small details
- `<html>` gets `scroll-behavior: smooth` only under `prefers-reduced-motion: no-preference`.
- **External links** get a visible `↗` suffix (CSS `::after`, `aria-hidden`), plus an accessible note via a visually hidden "(opens external site)" only where they open new tabs. Prefer the same tab.
- **Print styles for every page**, not just the resume: black on white, hide the nav, URLs after links (`a[href^="http"]::after { content: " (" attr(href) ")" }`), and boxes keep their borders.
- **Copy-to-clipboard for the email:** in the dashboard contact box and the man page's SEE ALSO, add a tiny `[copy]` button next to the email that writes to the clipboard and shows `copied ✓` for 2s in a polite live region. Guard for clipboard API failures.
- **Last-updated:** the man page footer already shows the build month. Also expose the build date on `/resume/` as `-- EOF -- (built YYYY-MM-DD)` in dim, if it fits the 78 columns.
- **Selection color**, scrollbar styling and the focus ring: one more consistency pass across pages.

## 8. GitHub refresh script
The repo count (43) and stars in `content/github.ts` come from a snapshot taken 2026-11-19 (`design/source/github.md`).
- Add `scripts/github-sync.ts`, run as `pnpm github:sync`. It calls the public GitHub REST API (no token needed; use `GITHUB_TOKEN` if set to avoid rate limits) for user `Kushal-Shr`.
- It rewrites only `repoCount`, `snapshotDate` and per-repo `stars` in `content/github.ts` (or a sibling `content/github.json` that the TS module imports). Then it prints a diff summary.
- **Never call it during `pnpm build`.** The build must stay offline and deterministic. Kushal runs it manually now and then, and commits the change.
- If a featured repo has been renamed or deleted (404), fail loudly with the name.
- Badges that show stars (AirDesk `★1 · python`) read the synced value.

## 9. Repo README.md (recruiters will look at the GitHub repo too)
Write a root `README.md` that is itself a showcase:
- A one-paragraph pitch, with a screenshot placeholder `docs/screenshot.png`. Generate the screenshot with Playwright: `/` after neofetch at 1280×800.
- **Live site:** `TODO` (set at deploy time).
- **Stack** and *why*: static export, Server Components with small islands, a pure shell engine.
- **Architecture:** a short tree, plus "how the shell works" in 5 bullets.
- **Commands:** dev, check, e2e, journey:new, content:todos, github:sync.
- **Posting a journey entry:** the 4-step workflow.
- **Accessibility and performance notes:** what was tested.
- **Credits:** JetBrains Mono (OFL).

## Tests to add
- **Unit:**
  - the new easter-egg commands
  - JSON-LD shape (valid JSON, `<` escaped)
  - 404 suggestion
- **E2E:**
  - Every route has a unique `<title>`, a meta description, a canonical, and `og:image` pointing to a file that returns 200 with `image/png`.
  - `/sitemap.xml` lists every route.
  - `/robots.txt` exists.
  - Unknown path → the 404 page shows the path and a suggestion.
  - The `[copy]` button writes the email to the clipboard. Grant the clipboard permission in Chromium.
- Update the visual baselines **deliberately** where this phase changed visuals (`↗` suffixes, copy buttons). Review each diff before accepting it.

## Definition of done
- [ ] Lighthouse ≥95 in all four categories on the measured routes, mobile and desktop. Include the scores table.
- [ ] Shared links show the right image, title and description. Check them with a local OG preview (open the generated meta tags), and list the URLs Kushal can paste into the LinkedIn Post Inspector after deploying.
- [ ] 404, icons, manifest, sitemap and robots are present in `out/`.
- [ ] `pnpm check` and `pnpm test:e2e` pass.

## Finish
- Commit: `feat: SEO, social previews, 404, shell easter eggs, performance and README`.
- Report:
  - the Lighthouse table
  - the OG images (attach or describe them)
  - the JS size table before and after any optimizations
  - the list of easter eggs
