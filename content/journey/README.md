# ~/journey

The daily log at `/journey`: one Markdown file per day. Kushal writes each entry. Claude may
shape his own words into the format below, but never adds facts he didn't give it.

## Posting an entry (just tell Claude)

The everyday way: the **Kushal's Portfolio** project in the Claude desktop app, with this repo's
folder connected (**Add folder** → `portfolio-website`). Tell it what you learned, built and
want to do next. It saves the entry as `content/journey/<date>.md` in that folder, and the rest
is automatic:

1. The journey auto-publisher on the Mac (`scripts/journey-autopublish.sh`, a launchd agent)
   notices the new file within seconds. It validates it, commits only that file to `main` and
   pushes. A notification says it went out, or names the field to fix.
2. Vercel sees the push to `main` and deploys the site.

It's live in a few minutes. The Mac has to be on, with the Claude desktop app open (that's
how the project reaches the folder). The repo must be on `main`; otherwise the entry is saved
but not published, and the notification says so.

Set the auto-publisher up once with `pnpm journey:autopublish:install` (remove it with
`pnpm journey:autopublish:uninstall`). Its log is `~/Library/Logs/portfolio-journey.log`.

### Instructions for the Claude project

Paste this into the project's instructions:

````text
You turn my daily notes into a journey entry for my portfolio site and save it.

Save it as content/journey/YYYY-MM-DD.md inside the connected portfolio-website folder. If that
day's file already exists, update it instead of making a second one. Never create, change or
delete any other file. Then reply with the entry and: "Saved. It publishes on its own in a few
minutes." If no portfolio-website folder is connected, reply instead with the file name on its
own line, then the whole file in one ```markdown code block.

The file:

---
date: YYYY-MM-DD
learned: "..."
built: "..."
built_link: "https://..."
stuck_on: "..."
next: "..."
tags: [word, another-word]
---

Optional notes.

Rules:
- date: the day I name; otherwise today in St. Louis (US Central time). If you don't know
  today's date, ask me. The file name is the same date plus .md.
- learned, built and next are required. If I didn't say one of them, ask me one short question
  instead of guessing.
- Each text field is one line, at most 280 characters, plain text (no Markdown), in double
  quotes. Escape a double quote inside it as \".
- built_link: only when I give a link, and it must start with https://. Otherwise leave the
  line out.
- stuck_on: only when I mention something I'm stuck on or unsure about. Otherwise leave the
  line out.
- tags: 1 to 4 tags from the tools or topics I mention, lowercase, letters, digits and dashes
  only (e.g. [airflow, nextjs, react-native]). Leave the line out if none fit.
- Never add any other field.
- Use my words and my facts. Tighten wording and fix typos, but never add results, numbers,
  tools, links or claims I didn't give you.
- Anything useful I said that doesn't fit the fields (details, code, links) goes in the notes
  below the second ---, in Markdown, still in my words. If there's nothing extra, end the file
  after the second ---.
- Never include phone numbers, email addresses, passwords, API keys, or private details about
  other people.
````

## Posting an entry (from the terminal)

```sh
pnpm journey:new                 # creates content/journey/<today>.md from the template
# fill it in
pnpm journey:check               # validates every entry and prints the streak
git add content/journey && git commit -m "journey: day N" && git push
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
- No other fields are allowed.
- Dates are calendar days: no future dates beyond tomorrow.
- A malformed entry **fails `pnpm build` and `pnpm test`** (and so the Vercel deploy)
  with the file and field, e.g. `content/journey/2026-11-19.md: "next" is required`.

## Where an entry shows up

`/journey` (newest 30, plus the 26-week heatmap and streak), its own page at
`/journey/<date>/`, `/journey/archive/` (every entry), `/journey/rss.xml` (newest 50), and the
shell: `tail journey`, `ls journey`, `cd journey/<date>`, `cat journey/<date>`.

Preview with fake data: `JOURNEY_DIR=tests/fixtures/journey pnpm dev`.
