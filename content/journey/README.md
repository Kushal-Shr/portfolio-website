# ~/journey

The daily log at `/journey`: one Markdown file per day, written by Kushal. Nothing in this
folder is generated, and no entry is ever written for him.

## Daily workflow

```sh
pnpm journey:new                 # creates content/journey/<today>.md from the template
# fill it in
pnpm journey:check               # validates every entry and prints the streak
git commit -am "journey: day N" && git push   # the static site rebuilds
```

Backfill a missed day with `pnpm journey:new --date 2026-11-18`.

## Format

```md
---
date: 2026-11-19 # must equal the file name
learned: How Airflow's deferrable operators free worker slots.
built: Wired the journey heatmap for my portfolio.
built_link: https://github.com/... # optional, https only
stuck_on: Timezone edge cases in streak math. # optional
next: Write the RSS feed.
tags: [airflow, nextjs] # optional: lowercase, a-z 0-9 and dashes
---

Optional longer notes in Markdown: code blocks, links and lists are all fine. Headings start
below the entry's own heading, so `#` is fine too.
```

- `learned`, `built` and `next` are required, 280 characters at most.
- Dates are calendar days: no future dates beyond tomorrow.
- A malformed entry **fails `pnpm build` and `pnpm test`** with the file and field, e.g.
  `content/journey/2026-11-19.md: "next" is required`.

## Where an entry shows up

`/journey` (newest 30, plus the 26-week heatmap and streak), its own page at
`/journey/<date>/`, `/journey/archive/` (every entry), `/journey/rss.xml` (newest 50), and the
shell: `tail journey`, `ls journey`, `cd journey/<date>`, `cat journey/<date>`.

Preview with fake data: `JOURNEY_DIR=tests/fixtures/journey pnpm dev`.
