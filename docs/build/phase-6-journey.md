# Phase 6: The daily journey log (Markdown in the repo)

> Paste this whole file into a fresh Claude Code session at the repo root.

You are building phase 6 of 10 of Kushal Shrestha's terminal portfolio. Phases 0–5 are done, and the shell has a `journey/` directory that is still empty. This phase builds `~/journey`: a public daily log of what Kushal learned and built. It's how the site stays alive and shows consistency to recruiters.

**Publishing workflow (decided):**
1. Kushal runs `pnpm journey:new`, which creates today's Markdown file from a template.
2. He fills it in.
3. He commits and pushes, and the static site rebuilds.

There is no CMS and no backend.

## Read first
1. `docs/build/CONTEXT.md`. Note "Do not invent facts": you will **not** write real journey entries. Kushal writes those.
2. `design/artboards/Journey.dc.html`, including the script (the heatmap math).
3. The journey parts of `design/artboards/Main.dc.html` (`J`, `DIRS['~/journey']`, `tail`) and of `Guide.dc.html` (`tail journey`).
4. `lib/shell/fs.ts` (the `journeyEntries` hook point), `lib/hooks/*` and `components/terminal/*`.

## 1. Entry format
One file per day: `content/journey/YYYY-MM-DD.md`.
```md
---
date: 2026-11-19          # must equal the filename
learned: How Airflow's deferrable operators free worker slots.
built: Wired the journey heatmap for my portfolio.
built_link: https://github.com/Kushal-Shr/...   # optional
stuck_on: Timezone edge cases in streak math.  # optional
next: Write the RSS feed.
tags: [airflow, nextjs]                         # optional, lowercase, [a-z0-9-]
---

Optional longer notes in Markdown. Code blocks, links and lists are all fine.
```

**Validation** (`lib/journey/schema.ts`, zod):
- `date` is a valid `YYYY-MM-DD` and matches the filename.
- `learned`, `built` and `next` are required non-empty strings (≤ 280 chars each). `stuck_on` is optional.
- `built_link` is an optional `https` URL.
- `tags` are optional, and each is lowercase kebab-case.
- No future dates beyond tomorrow (allows for timezone skew).
- **Build-time failure is a feature.** A malformed entry fails `pnpm build` and `pnpm test` with a message naming the file and field, e.g. `content/journey/2026-11-19.md: "next" is required`.

**Dates are calendar dates, not instants.** Never parse `YYYY-MM-DD` with `new Date('2026-11-19')`: that's UTC midnight and shows the previous day in St. Louis. Write tiny helpers in `lib/journey/dates.ts`:
- `parseDay(s) → { y, m, d }`
- `dayNumber(day)` (days since epoch, computed in UTC math on the components)
- `addDays`
- `formatDay(day)` (`Thu Nov 19 2026`)
- `todayLocal()` (from the viewer's clock)

Unit-test them, including month and year boundaries and DST weeks.

## 2. Loading: `lib/journey/load.ts` (server-only)
- `import 'server-only'`.
- Read `content/journey/*.md` with `node:fs`, parse with `gray-matter`, and validate.
- Render the body to HTML with `remark` + `remark-gfm` + `remark-html`. Keep sanitization on.
- Sort newest first. Return `JourneyEntry[]` with `date`, the fields, `bodyHtml`, `slug` (= date) and `day` (the day number, see below).
- Cache per build (module-level memo).
- **Zero entries is a valid state**: the folder may not exist yet. Return `[]`.

## 3. Derived stats: `lib/journey/stats.ts` (pure, unit-tested)
- **`day` for an entry** = days since the **first** entry's date + 1. Kushal's first entry is day 1, and the label stays stable when days are skipped.
- **Header `day N`** = today's day number relative to the first entry, or `0` with no entries.
- **Streak** = the number of consecutive calendar days with an entry, ending **today or yesterday**. The streak doesn't drop to 0 in the morning before today's entry is posted. With no entries it's 0.
- **Longest streak**: show it in the header if it's larger than the current one.
- **Heatmap grid** (port the design's math), 26 weeks × 7 rows:
  - Columns are weeks, oldest on the left. Rows are Sun..Sat. Today is in the last column at its weekday row.
  - Cells after today are blank.
  - Each cell is `{ date, logged: boolean, future: boolean }`.
  - Row labels show only Mon, Wed and Fri (odd rows), 5ch wide, as in the design.
- All functions take `today` as a parameter: no hidden clock.

## 4. Pages

### `/journey`: match `Journey.dc.html` at 1280px
- `TerminalPage` with prompt `tail -f ~/journey/log`.
- **Header row** (flex, `space-between`, wraps):
  - left: bold 20px `~/journey`, then dim `  ·  what I learned and built, every single day`
  - right: dim `day N · streak N days · journey.rss`, with the day in green bold, the streak in yellow bold, and `journey.rss` linking to the feed
- **Heatmap `Box` "last 26 weeks"**:
  - `<section aria-label="Activity over the last 26 weeks">`, at 14px with `line-height: 1.25` and `letter-spacing: 3px`. Logged days are a green `█`, others a `line-strong` `·`.
  - The legend line below: `· no entry   █ entry logged`.
  - **Accessibility:**
    - The visual grid is `aria-hidden`.
    - A visually hidden summary sits beside it: "N entries in the last 26 weeks. Current streak N days. Longest streak N days."
    - Each logged cell is also a link to its entry (`/journey/2026-11-19/`) with a `title`/`aria-label` of the date. They are focusable, but put the grid's links in **one** tab stop group: only the latest has `tabIndex=0`, and arrow keys move between them. Simpler fallback, if needed: no links in the grid, plus an "all entries" list below.
- **Entries** (newest first, up to 30). Each is an `<article id={date}>`:
  - The `<h2>` is yellow bold `── day {day} · {formatDay} ───…`. The trailing rule fills to the line width with CSS (a flex child with a border or a repeated `─` that clips), not a fixed count.
  - A 12ch / 1fr grid: green `learned`, blue `built` (+ `built_link` as a link), red `stuck on` (omitted if absent), dim `next`.
  - Tags render purple as `#tag`.
  - `bodyHtml`, when present, is styled terminal-like within the article:
    - `h1`–`h3` yellow with a `#` prefix via `::before`
    - `code` and `pre` on `bg-raised`
    - blue links
    - lists with a `-` marker
  - The `day N` heading links to the permalink.
- **More than 30 entries:** add a link `ls ~/journey/archive` → `/journey/archive/`, which lists every entry as one line (`2026-11-19  day 12  learned: …`, truncated), grouped by month.
- **Footer line:** dim `tail: waiting for tomorrow's entry █`, with a blinking cursor.
- **Empty state** (no entries): the header shows `day 0 · streak 0 days`, the heatmap is all dots, and in place of the entries: dim `tail: ~/journey/log: no entries yet — the first one lands soon █`. **Make sure the empty state looks intentional and good.** It's what the site will show on launch day if Kushal hasn't posted yet.

### "Today" must be the viewer's today, on a static site
The site is built once and then served for days. If the server-rendered heatmap used the build date, it would go stale.
- Server-render with the build date. Then, in a small client island, recompute the grid, header day and streak on mount with `todayLocal()` from the **list of entry dates** (pass just the date strings as props; tiny).
- Avoid hydration mismatches: the server value renders first and the client updates in an effect.
- Unit-test that a build on day X viewed on day X+3 shows the streak correctly (today or yesterday rule), the shifted grid, and the right `day N`.

### `/journey/[date]`: permalink
- `generateStaticParams` from the entries.
- Prompt: `cat ~/journey/{date}.md`.
- Shows the single entry, same component, with `‹ prev` / `next ›` links (dim, 44px targets) and `cd ..` back to `/journey/`.
- `generateMetadata`: title `day N · {date}`, with the description from `learned`.
- Handle zero entries: Next's static export needs a placeholder param or `dynamicParams = false` behavior. Make sure `pnpm build` succeeds with an empty `content/journey/`.

### RSS: `/journey/rss.xml`
- Implement as an `app/journey/rss.xml/route.ts` GET with `export const dynamic = 'force-static'`, returning `application/rss+xml`.
- RSS 2.0:
  - channel title `Kushal Shrestha — ~/journey`, link, description and `lastBuildDate`
  - up to 50 items, each with:
    - title `day N · learned: {learned}`
    - link and `guid` (`isPermaLink`) to the permalink
    - `pubDate` (the entry date at 12:00 America/Chicago, as RFC 822)
    - a description with all fields as escaped HTML, plus `category` per tag
- Escape XML properly. Write a unit test with a tricky entry (`&`, `<`, quotes, emoji).
- **Verify the build output really is `out/journey/rss.xml`**, given `trailingSlash: true`. If Next emits something else (e.g. a directory), switch to a `prebuild` script (`scripts/build-rss.ts`) that writes `public/journey/rss.xml`, and document why in a comment.
- Add feed autodiscovery in the root metadata: `alternates.types['application/rss+xml']`.

## 5. Shell integration
- `app/page.tsx` passes the entries (date plus fields only, no `bodyHtml`) to `buildVirtualFs(content, journeyEntries)`.
- `~/journey/` lists `YYYY-MM-DD.md` files (newest first, capped at 30 for `ls`).
- `cat journey/2026-11-19.md` prints the design's format:
  - a yellow `── 2026-11-19 ──` header
  - `learned  …`, `built    …`, `stuck on …`, `next     …`
  - the "↗ open … as a page" link to the permalink
- `tail journey` (and plain `tail`) prints `==> ~/journey/{latest}.md <==` in dim, the entry lines, and a `↗ open the full journey log` link. With no entries: dim `tail: ~/journey: no entries yet`.
- Update the shell unit tests with fixture entries (`tests/fixtures/journey/*.md`, made-up test data, clearly fake).
- The home page's neofetch row `Learning:  see ~/journey, updated daily` stays as-is.

## 6. `pnpm journey:new`
`scripts/new-entry.ts`, run with `tsx`:
- Defaults to today's **local** date. Accepts `--date YYYY-MM-DD` for backfilling.
- Refuses to overwrite an existing file, and prints its path instead.
- Writes the template with every field present and a short comment hint on each, e.g. `learned: ""   # what clicked today`.
- Prints the path and the next steps: `fill it in → pnpm check → git commit -m "journey: day N" → push`.
- If `$EDITOR` is set, offers to open the file.
- Optionally add `pnpm journey:check`, which validates all entries and prints the current streak. It's a nice daily confirmation.

## 7. Seed data
- **Do not commit invented entries** to `content/journey/`.
- Commit a `content/journey/README.md` explaining the format and the workflow. **Exclude README.md from the loader.**
- For development and tests, use the fixtures. Let the loader take a directory parameter so tests can point at `tests/fixtures/journey/`.
- Optionally, set `JOURNEY_DIR` in dev to preview a populated page.

## Tests
- **Unit:**
  - dates, stats (streak rules, heatmap shape, day numbers, the today/yesterday rule, empty input)
  - schema errors (readable messages)
  - RSS escaping and validity: parse the XML back with a tiny parser, or at least check well-formedness
  - shell `tail` and `cat` for journey files
- **E2E**, run twice:
  - against the real (possibly empty) content: the empty state renders
  - with fixtures, building with `JOURNEY_DIR=tests/fixtures/journey`; this can be a separate Playwright project or a quick separate build in CI. Assert:
    - the heatmap has logged cells
    - a permalink page works
    - `rss.xml` is served with an XML content type
    - the shell's `tail journey` shows the latest fixture
- Both runs: no axe violations and no console errors.

## Definition of done
- [ ] `pnpm journey:new` creates a valid file. After filling it in, `pnpm build` shows it on `/journey`, its permalink, the heatmap, `tail journey` and the RSS feed.
- [ ] A malformed entry fails the build with a precise message.
- [ ] The empty state looks deliberate and polished.
- [ ] No timezone off-by-one: the tests prove it.
- [ ] `pnpm check` and `pnpm test:e2e` pass.

## Finish
- Commit: `feat: daily journey log with heatmap, streaks, permalinks and RSS`.
- Report:
  - screenshots (empty state, and populated with fixtures)
  - the exact daily workflow for Kushal in 4 lines
