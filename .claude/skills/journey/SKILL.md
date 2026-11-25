---
name: journey
description: Turn what Kushal says he learned, built or plans next into a journey entry (content/journey/YYYY-MM-DD.md), validate it, commit and push it so it publishes to the live site. Use whenever he shares his day's progress, says "journey", "log today", "today I learned", or asks to add, fix or backfill a journey entry.
---

# Posting a journey entry

Kushal tells you about his day; you turn it into one entry and publish it. He has asked for this
to be hands-off: once the entry is valid, commit and push without asking for approval.

## 1. Write the entry

Follow the **Rules** in the ````text block under "Instructions for the Claude project" in
`content/journey/README.md`. They are the single source for the format. In short:

- `learned`, `built` and `next` are required. If he didn't give one, ask one short question and
  wait. Never guess.
- His words and facts only: tighten wording and fix typos, but add no results, numbers, tools,
  links or claims he didn't give.
- One line each, at most 280 characters, plain text in double quotes. `built_link` (https only)
  and `stuck_on` only when he gave them. 1 to 4 lowercase tags from what he mentioned. No other
  fields. Extra detail he gave goes in the Markdown notes below the frontmatter.
- No phone numbers, email addresses, secrets or private details about other people.

The date is the day he names, otherwise today in St. Louis:

```sh
TZ=America/Chicago date +%F
```

Create the file with `TZ=America/Chicago pnpm journey:new` (add `--date YYYY-MM-DD` to backfill),
then fill it in. If that day's file already exists, he is fixing or adding to it: edit it rather
than creating a second entry.

## 2. Validate

```sh
pnpm journey:check
```

If `node_modules` is missing, run `pnpm install --frozen-lockfile` first (and if `pnpm` itself
is missing, `npm install -g pnpm@12.21.0`). Fix anything it reports. If the check can't run at
all (no network in a cloud session), push anyway: the publish workflow runs the same check
before anything reaches `main`. Tell him you couldn't check it locally.

Only the entry file changes: never edit other files as part of a journey post, or the branch
won't auto-publish.

## 3. Commit and push

Commit only the entry: `git add content/journey/<date>.md`, message `journey: <date>`.

- On `main` (his laptop): `git push origin main`. The CI/CD workflow tests and deploys it.
- On any other branch (a Claude Code cloud session): push that branch. The "Publish journey
  entry" workflow (`.github/workflows/journey.yml`) validates it, commits it to `main`, deletes
  the branch and starts the deploy. Don't open a pull request.

## 4. Report back

Show him the entry as it went out, and say it will be live in about 10 minutes (the repo's
Actions tab shows progress). If the push or a check failed, say so plainly with the error.
