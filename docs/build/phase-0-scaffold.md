# Phase 0: Scaffold the project

> Paste this whole file into a fresh Claude Code session started at the repo root (`portfolio-website/`).

You are starting phase 0 of 10 of Kushal Shrestha's terminal-themed portfolio. This phase sets up the project, tooling and tests so every later phase has a solid, fast feedback loop. **No visual work happens in this phase.**

## Read first
1. `docs/build/CONTEXT.md`: the project brief. Its rules apply to everything you do.
2. `docs/build/README.md`: the phase list, so you know what comes later.
3. `design/README.md`: skim it, so you know where the design lives.

## Current state
- The repo has a `.git` directory, `design/` (design source, never modify) and `docs/` (these prompts, never modify).
- There is no `package.json` yet. A stray `.DS_Store` may exist.

## Tasks

### 1. Environment checks
- Confirm Node is a current LTS that the latest Next.js supports (`node -v`), and that pnpm is available (`corepack enable` if needed). If Node is too old, stop and tell me what to install. Do not work around it.
- Look up current stable versions: `pnpm view next version`, `pnpm view tailwindcss version`. Use the latest stable releases, never canary, beta or rc.

### 2. Create the Next.js app
- `create-next-app` refuses to run in a non-empty directory. Scaffold into a temporary sibling directory with:
  - TypeScript
  - App Router
  - Tailwind CSS
  - ESLint
  - no `src/` dir
  - import alias `@/*`
  - pnpm

  Then move the generated files into the repo root. Do **not** overwrite or touch `design/`, `docs/` or `.git/`, and delete the temp directory afterwards.
- Remove all boilerplate:
  - default page content, demo SVGs in `public/`, default Geist fonts
  - default `globals.css` content except the Tailwind import
- Replace `app/page.tsx` with a minimal placeholder: a `<main>` containing `portfolio-sh: booting…`.

### 3. Next.js config (`next.config.ts`)
- `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`, `reactStrictMode: true`.
- Read the docs that ship with the installed Next.js version (check `node_modules/next/` for docs or an AGENTS.md hint, or the official docs for that exact major version) before relying on any API. Do not assume APIs from older majors.

### 4. TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `forceConsistentCasingInFileNames: true`.
- Path alias `@/*` → `./*`.

### 5. Linting and formatting
- ESLint uses the flat config that create-next-app generated (Next core-web-vitals + TypeScript). Use the ESLint CLI directly (`eslint .`), not a deprecated `next lint`. Ignore `design/`, `out/`, `.next/`, `playwright-report/` and `test-results/`.
- Add rules: `@typescript-eslint/no-explicit-any: error`, `no-console: ['warn', { allow: ['warn', 'error'] }]`, `react/jsx-no-target-blank: error`.
- Prettier + `prettier-plugin-tailwindcss`: `printWidth: 100`, `singleQuote: true`, `semi: true`, `trailingComma: 'all'`. Add a `.prettierignore` covering `design/`, `docs/`, `out/`, `.next/` and `pnpm-lock.yaml`.

### 6. Unit tests: Vitest
- `vitest.config.ts` with the `@` alias. The default environment is `node`; component and hook tests opt in with `// @vitest-environment happy-dom`.
- Dev deps: `vitest`, `happy-dom`, `@testing-library/react`, `@testing-library/dom`, `@vitejs/plugin-react` (if needed for TSX in tests).
- Tests live in `tests/unit/**/*.test.ts(x)`.
- Add one sanity test (`tests/unit/sanity.test.ts`) so the runner is proven to work. Later phases replace it.

### 7. End-to-end tests: Playwright + axe
- Dev deps: `@playwright/test`, `@axe-core/playwright`, `serve`. Install the Chromium browser only (`pnpm exec playwright install chromium`).
- `playwright.config.ts`:
  - `testDir: 'tests/e2e'`
  - `webServer`: build then serve the static export, e.g. `pnpm build && pnpm exec serve out -l 4173 --no-clipboard`, on `http://localhost:4173`, with `reuseExistingServer: !process.env.CI` and a generous timeout
  - Projects (all Chromium):
    - `desktop`: viewport 1280×800
    - `mobile`: `devices['Pixel 7']`
    - `desktop-reduced-motion`: 1280×800 with `reducedMotion: 'reduce'`
  - `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`
- Add `tests/e2e/utils.ts` with:
  - `expectNoA11yViolations(page)`: runs AxeBuilder with tags `wcag2a`, `wcag2aa`, `wcag21aa` and `wcag22aa`, and fails with a readable list of violations
  - `collectConsoleErrors(page)`: attaches listeners for `console` errors and `pageerror`, returns an array to assert empty
  - `expectNoHorizontalScroll(page)`: asserts `document.documentElement.scrollWidth <= window.innerWidth`
- Add a smoke test `tests/e2e/smoke.spec.ts`: `/` loads with status 200, shows `portfolio-sh`, has no console errors and no axe violations.

### 8. Scripts (`package.json`)
- `dev`, `build` (`next build`), `serve` (`serve out -l 4173`)
- `lint` (`eslint . --max-warnings 0`), `typecheck` (`tsc --noEmit`)
- `format`, `format:check`
- `test` (`vitest run`), `test:watch`, `test:e2e` (`playwright test`)
- `check`: runs `lint`, `typecheck`, `test` and `build` in sequence
- Also add `"packageManager"` (pin the pnpm version you used), `"engines": { "node": ">=<the LTS major you confirmed>" }`, and an `.nvmrc` with that major.

### 9. Site config
- `.env.example` with `NEXT_PUBLIC_SITE_URL=https://example.com` and a comment that the real domain gets set at deploy time.
- `lib/site.ts` exports `siteUrl` (from the env var, falling back to `https://example.com`), `siteName = 'Kushal Shrestha'`, and `githubRepoUrl` (leave as a `// TODO(kushal)` placeholder).

### 10. Git hygiene
- `.gitignore`:
  - `node_modules/`, `.next/`, `out/`, `coverage/`, `playwright-report/`, `test-results/`, `blob-report/`
  - `.env*.local`, `.env` (but **not** `.env.example`)
  - `.DS_Store`, `*.log`, `.vercel`, `.idea/`, `reports/` (Lighthouse and review output from phases 8–9)
  - `.vscode/*` except `.vscode/extensions.json`
- Add `.vscode/extensions.json` recommending the ESLint, Prettier, Tailwind CSS IntelliSense and Playwright extensions.
- Remove any tracked or untracked `.DS_Store` files.

### 11. CLAUDE.md
Create a short `CLAUDE.md` at the root so every future session loads the brief automatically:
```md
# Kushal's terminal portfolio

@docs/build/CONTEXT.md

## Commands
- `pnpm dev`: dev server
- `pnpm check`: lint + typecheck + unit tests + build (run before every commit)
- `pnpm test:e2e`: Playwright (builds and serves `out/`)

## Never edit
- `design/` (design source of truth)
- `docs/build/` (build prompts)
```

## Definition of done
- [ ] `pnpm check` passes with zero warnings.
- [ ] `pnpm test:e2e` passes in all three Playwright projects.
- [ ] `pnpm build` produces `out/index.html`, and `pnpm serve` serves it.
- [ ] `design/` and `docs/` are byte-for-byte unchanged (`git status` shows nothing modified under them).
- [ ] No create-next-app boilerplate remains (no Geist, no demo SVGs, no "Get started by editing").

## Finish
1. Run `pnpm check` and `pnpm test:e2e` one final time and paste the summary lines.
2. Commit everything with the message `chore: scaffold Next.js static site, tooling and tests`.
3. Report:
   - the installed versions (Node, pnpm, Next, React, Tailwind, Playwright)
   - anything that differed from these instructions and why
