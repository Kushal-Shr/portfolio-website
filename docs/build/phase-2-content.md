# Phase 2: Content layer (single source of truth)

> Paste this whole file into a fresh Claude Code session at the repo root.

You are building phase 2 of 10 of Kushal Shrestha's terminal portfolio. Phases 0–1 are done: tooling, tokens, shared components and route stubs. This phase extracts **every fact** from the design into typed content modules. After this, no page, shell command or resume line ever hard-codes a job title, date, link or project description; they all read from `content/`.

This phase matters more than it looks. The design repeats the same facts in 6+ places (man page, experience log, resume, shell `cat` output, dashboard, projects), and they already drift slightly. Getting the model right here makes every later phase simpler and keeps the site consistent forever.

## Read first
1. `docs/build/CONTEXT.md`: especially "One source of truth for content" and "Do not invent facts".
2. `design/source/resume.md` (the fact source) and `design/source/github.md` (GitHub snapshot + Sanctuary facts).
3. **Every** artboard in `design/artboards/`. Read them all fully, including the `<script>` blocks. `Main.dc.html`'s `FILES` object and the `info` array in `renderVals` hold shell copy, and `Tui.dc.html` and `Skills.dc.html` hold data in their scripts.

## Tasks

### 1. Content modules: `content/`
Create typed modules. Use `as const satisfies …` or explicit types exported from `content/types.ts`. Below is the minimum shape. If a view in the design needs a field that isn't listed, **add the field to the type** rather than hard-coding copy in a view later.

**`content/profile.ts`**
- `name`, `shortName` (`kushal`), `role` (`CS student · data & AI`), `tagline`
  - The tagline is the shell intro: "Hi, I'm Kushal Shrestha — I build data pipelines and AI products in St. Louis."
- `oneLiner` (the man-page NAME line), `location` (`St. Louis, MO`), `timezone` (`CT`)
- `openTo: ['AI', 'data', 'full-stack', 'devops']`
- `email`, `links: { github, linkedin }`, each with `{ href, label }`
  - **No phone field.** The phone number lives only inside the PDF (see CONTEXT.md).
- `education: { school, degree, emphasis, start, end, gpa }`, from the resume: "Bachelor of Science in Computer Science", emphasis "Machine Learning", 2024–2028, GPA 3.82
- `about`: paragraphs (the man-page DESCRIPTION), plus a `short` variant for the shell's `about.md`
- `neofetch`: the `info` rows from `Main.dc.html` (Name, Role, Location, Uptime, Shell, Stack, Building, Learning, Contact)
  - Values that duplicate other fields must reference them (e.g. `Contact` → `email`), not repeat the string.
- `synopsisFlags: ['data', 'ml', 'fullstack', 'devops']`

**`content/experience.ts`**: an array, newest first. Each entry:
- `id`, `commit` (the fake hash from the design: `7c41e9a`, `2d90b5f`, `9ae3c10`, `51f7d28`)
- `title`, `org`, `orgShort?`
- `start` and `end` as `'YYYY-MM'` strings, `end: 'present'` allowed
- `location`, `workMode?` (`Hybrid`, `Remote`)
- `bullets` (full versions from `Experience.dc.html`)
- `summary` (the one-line man-page version)
- `resumeBullets` (the resume's wording, **only if it genuinely differs**; otherwise reuse `bullets`)
- `stack: string[]`

**`content/projects.ts`**: an array in display order (**five** projects: rant-and-heal, zenith, surgipath, airdesk, sanctuary). Each entry:
- `slug` (`rant-and-heal`), `name` (`Rant & Heal`), `alias?` (`Ghost Visualizer`)
- `badge` (`Best Overall · Hackfest 2025`, `vs code extension`, `prototype`, `★1 · python`), `badgeTone: 'highlight' | 'dim'`
- `featured: boolean` (exactly one is true: rant-and-heal, the green box)
- `tags: string[]` (lowercase, as shown in brackets)
- `summary` (the Projects page paragraph), `shortSummary` (the man page and resume line)
- `diagram: string`: the exact ASCII from `Projects.dc.html`, preserving every space
  - `diagramWide?: string`: the wider rant-and-heal diagram from `Tui.dc.html`
  - `diagramAlt: string`: a one-sentence text description of the diagram for screen readers
- `bullets: string[]`
- `links: { source?: string; devpost?: string }`
  - **Rant & Heal: `source` only** (`rant-and-heal-v2`). Drop the design's project-card `[devpost]`, per Kushal. The Devpost URL moves to the Hackfest entry in `achievements.ts`.
- `outcome?: { label: 'result' | 'status'; text: string }` (from the shell's `FILES`)
- `resumeStack: string[]`
- `onResume: boolean`: true for the four in the design's `resume.txt`, false for Sanctuary
- `team?: { size: number }`: Sanctuary is a team of 4

**Sanctuary** is the 5th project and is not in any artboard. Build its entry from `design/source/github.md` only:
- `slug: 'sanctuary'`, `name: 'Sanctuary'`, source `https://github.com/Kushal-Shr/NLN`
- badge `team of 4` (dim), not featured, `onResume: false`
- tags: `[next.js] [gemini] [prisma] [postgres] [livekit]`
- `summary`: what the product is, in the site's plain voice. For example: "A stealth mental-health platform that doesn't look like one: Gemini reframes clinical terms into cultural language, journals self-destruct, and group sessions run anonymously over encrypted video." Keep it factual, from the README.
- `diagram`: a small ASCII architecture in the same style and width as the others (≤ 60 cols), built only from the README's stack, e.g. `user → Next.js app → Gemini (reframing) / Postgres via Prisma / LiveKit (video)`. Add a matching `diagramAlt`.
- `bullets`: **product facts** from the README (privacy-first with Quick Exit and anonymous auth; cultural reframing engine; encrypted group and 1:1 sessions), then **one `Todo('add: the parts of Sanctuary you built yourself')`**.
  - Never state or imply that Kushal built specific features. It's a 4-person team.
- `outcome`: `{ label: 'status', text: 'team project, built in 2 days (March 2026)' }`
- Add these questions to your report: whether it was a hackathon (which one, any result), and Kushal's own contribution.

Also export `extraProjects` for the footer mention: real-life Among Us, PickHacks Community Vote Winner, with its devpost link. Put GitHub numbers in `content/github.ts`: `repoCount: 43` and `snapshotDate: '2026-11-19'`, from `design/source/github.md`. They go stale, so they live in exactly one place. Phase 8 adds a script to refresh them. Views read `repoCount` from there.

**`content/leadership.ts`**: the `ps aux` rows:
- `pid`, `role`, `org`, `scope`, `stat: 'R' | 'Z'`
- `status: { text, tone: 'running' | 'exited' }`
- `summary`, `impact: ImpactItem[]`

**`content/achievements.ts`**:
- `event`, `award`, `description`, `year?`, `location?`, `link?`, `project?` (slug)
- The dashboard's `git log --oneline` box derives from this; it must not have its own copy.

**`content/skills.ts`**:
- `groups`: languages & web, ai & data, cloud/devops & tools. Each has a `key` (`languages` | `ai-data` | `cloud`), `title`, `packages: string[]` and `alsoUsed: string[]`.
- `learning: { name, note }[]` ("currently installing").
- The man-page OPTIONS rows (`-l, --languages`, …) and the resume SKILLS block must derive from these groups.
  - Where the design's groupings differ (OPTIONS has 4 rows; Skills has 3 boxes, with Languages & Web merged), model the finer-grained version (separate `languages` and `web` lists) and let views merge them.

**`content/guide.ts`**: the Guide page's sections and items: `what`, `cmd`, `hint`, and an optional static `output` for non-command items like `↑ ↓` and Tab. (Phase 5 generates real command outputs from the shell engine.)

**`content/portrait.ts`**: the ASCII portrait lines, exactly as in the `PORTRAIT` array in `Main.dc.html`.
- Copying this by hand is error-prone: backticks, backslashes and quotes. **Write a test** that extracts the `var PORTRAIT = [...]` JSON array from `design/artboards/Main.dc.html` and asserts deep equality with `content/portrait.ts`. Also confirm that `Tui.dc.html` has the identical array.

### 2. Placeholders the design left open
The design contains unfinished copy: `[add: members, events or workshops you ran]`, `[add: what changed because of you]`, `[add: a bill, event or change you drove]`, and the resume PDF link `#`. Never invent this content.
- Model it explicitly: `export const todo = (text: string) => ({ kind: 'todo', text }) as const;`. Fields that can hold one accept `string | Todo`.
- Views (phase 3) render a `Todo` in `fg-dim` inside brackets, exactly like the design.
- Add `scripts/content-todos.ts`, run as `pnpm content:todos` (via `tsx`). It walks every content export and prints each remaining `Todo` with its location, so Kushal has a checklist.

### 3. Derived formatting: `lib/format.ts` (pure, unit-tested)
- `formatRange(start, end, style)`. The styles are:
  | Style | Example |
  |---|---|
  | `'arrow'` | `2025-05 → 2026-09` (experience log, shell) |
  | `'dash'` | `2025-05 – 2026-09` (resume) |
  | `'years'` | `2025–2026`, or `2024` when start and end years match (man page) |
  - `end: 'present'` renders as `present`.
- `yearsSince(start, now)` (whole years) for the neofetch "Uptime" row: `{n} years shipping software`, counted from the earliest experience start.

### 4. Inconsistencies: resolve them with the resume
The design's copy drifts in places. **Facts** (titles, dates, numbers, names) follow `design/source/resume.md`. **Wording** follows the artboards. Where artboards disagree on wording, the more specific page wins (Experience over Man, Projects over Tui). These are already decided; apply them:
- **Amigo Groups title** is "Frontend **Software** Engineering Intern" everywhere (resume confirms). Update the man page, resume.txt and shell views.
- **Schnuck title** is "Data Engineering Intern" with the year-round note, as in the Experience artboard.
- **Education** uses the full degree from the resume: B.S. Computer Science, Machine Learning emphasis.
- **"three hackathon wins"** (resume.txt summary) becomes **"three competition wins"**. The resume lists them under *Competitions*, and Byte Bash 2.0 is a coding competition, not a hackathon.
- **Rant & Heal descriptions:** both are valid in context. The project summary says "hybrid mental-health app" (Projects artboard). The Hackfest achievement says "AI voice therapy mental health platform" (resume Competitions line).
- **Tui "what I did" bullets** use the Projects wording.
- **Neofetch "Uptime"** is computed from the earliest experience start (2023-09) as whole years ("3 years shipping software" as of 2026). Use `yearsSince`, evaluated at build time.
- **Metrics:** verify every number in content against the resume (20%, 10+ datasets, 3 datasets/100%, 300 daily visitors, 30%, 40%, 35%, GPA 3.82). All match today; the test below keeps them honest.

Find any **other** conflicts, apply the same rule, and list each one in your report.

### 5. Invariant tests: `tests/unit/content.test.ts`
- Slugs and ids are unique, and exactly one project is `featured`.
- Every date matches `YYYY-MM`, and `start <= end`. Experience is sorted newest first.
- Every URL is `https://` (or `mailto:`) and parses with `new URL()`.
- Every project has at least one link and a non-empty `diagramAlt`.
- Every `diagram` line is ≤ 60 characters. Phase 7 needs to know the widest one: record it in a comment.
- The portrait matches the design (see above).
- No string in content contains `[add:` (that must be a `Todo`, not a raw string).
- **Resume cross-check:** every percentage, count and `YYYY-MM` date in `content/experience.ts` and `content/profile.ts` appears in `design/source/resume.md`. Parse the resume's month names into `YYYY-MM` for the comparison.
- **Phone guard:** no file under `content/`, `app/`, `components/` or `lib/` contains the phone number or a phone-like pattern (`\d{3}[-. ]\d{3}[-. ]\d{4}`).
- Exactly 5 projects. Sanctuary has `onResume: false` and at least one `Todo`. Rant & Heal has no `devpost` link.

## Not in this phase
- Don't build page UIs; that's phase 3.
- Don't build the shell's virtual filesystem; that's phase 4. But do make sure everything the shell's `FILES` needs is representable.
- Don't touch the journey; that's phase 6.

## Definition of done
- [ ] Every fact that appears in any artboard exists exactly once in `content/`. Grep the artboards for a few distinctive strings ("10+ datasets", "300 daily visitors", "GHW School") and confirm each appears once in `content/`.
- [ ] `pnpm check` passes, and `pnpm content:todos` lists the placeholders.
- [ ] No React or Next imports inside `content/` or `lib/format.ts`.

## Finish
- Commit: `feat: typed content modules as single source of truth`.
- Report:
  - the content model (one line per module)
  - the full list of inconsistencies you found and which version you chose
  - the `content:todos` output
  - questions for Kushal (at least: Sanctuary's hackathon/result and his personal contribution)
