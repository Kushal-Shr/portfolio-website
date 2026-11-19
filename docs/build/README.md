# Build prompts

These are ready-to-paste prompts for building the terminal portfolio in 10 phases (0–9) with Claude Code.

## How to use them

1. Run the phases **in order**. Each one builds on the last.
2. Start a **fresh Claude Code session** for each phase, then paste the whole prompt file. Each prompt is self-contained: it tells the agent to read `docs/build/CONTEXT.md` and the relevant design files first.
3. Let the phase finish. Check its "Definition of done" list yourself and look at the site (`pnpm dev`).
4. Commit before moving on. Each prompt ends with a commit step.
5. If a phase goes sideways, revert the commit and re-run that phase's prompt with a note about what went wrong.

## Phases

| # | File | Builds |
|---|---|---|
| 0 | `phase-0-scaffold.md` | Next.js project, tooling, tests, CLAUDE.md |
| 1 | `phase-1-foundations.md` | tokens, fonts, layout, Box/Cursor/Nav/Prompt components |
| 2 | `phase-2-content.md` | typed content modules (single source of truth) |
| 3 | `phase-3-static-pages.md` | about, projects, experience, leadership, resume, dashboard |
| 4 | `phase-4-shell.md` | the interactive shell engine + home page |
| 5 | `phase-5-interactive-pages.md` | skills filter, guide |
| 6 | `phase-6-journey.md` | daily Markdown log, heatmap, streak, RSS, `journey:new` |
| 7 | `phase-7-responsive-a11y.md` | phones, keyboard, screen readers, contrast |
| 8 | `phase-8-polish.md` | SEO, OG image, 404, performance, details |
| 9 | `phase-9-final-review.md` | full audit against the design + fixes |

## Shared files

- `CONTEXT.md`: the brief every phase reads (design tokens, architecture rules, quality bar).
- `../../design/`: the design source. `design/README.md` explains how to read it.
