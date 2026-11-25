#!/bin/bash
# Publishes new or changed journey entries without a terminal. launchd runs this whenever
# content/journey/ changes (install it with `pnpm journey:autopublish:install`), for example when
# the Claude desktop project saves an entry into the connected portfolio folder.
#
# It validates the entries, commits only those files to main and pushes; Vercel then deploys.
# It never touches any other file, and it does nothing unless the repo is on main. Every run
# logs to ~/Library/Logs/portfolio-journey.log and ends with a notification.

set -uo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO" || exit 1

say() {
  echo "$(date '+%F %T') $1"
  osascript -e "display notification \"$1\" with title \"Portfolio journey\"" >/dev/null 2>&1 || true
}

# Let the writer finish (an entry can arrive in several writes) and fold a burst of file events
# into one run. A second run that starts meanwhile just exits; the first one picks up its files.
sleep "${JOURNEY_SETTLE_SECONDS:-5}"
LOCK="$REPO/.git/journey-autopublish.lock"
mkdir "$LOCK" 2>/dev/null || exit 0
trap 'rmdir "$LOCK"' EXIT

entries=()
while IFS= read -r line; do
  [[ "${line:0:2}" == *D* ]] && continue # a deleted entry is a human decision, not a post
  path="${line:3}"
  [[ "$path" =~ ^content/journey/[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$ ]] && entries+=("$path")
done < <(git status --porcelain --untracked-files=all -- content/journey)
[ ${#entries[@]} -eq 0 ] && exit 0

dates=$(for f in "${entries[@]}"; do basename "$f" .md; done | sort | paste -sd ' ' -)

branch=$(git symbolic-ref --short -q HEAD || true)
if [ "$branch" != main ] || [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] || [ -f .git/MERGE_HEAD ]; then
  say "Saved journey $dates, but the repo isn't on main (it's on ${branch:-a detached HEAD}). Not published."
  exit 0
fi

if ! check=$(pnpm journey:check 2>&1); then
  problem=$(printf '%s\n' "$check" | grep -m1 'content/journey/' || printf '%s\n' "$check" | tail -1)
  # AppleScript strings can't hold a double quote: show the field name in single quotes.
  say "Journey $dates not published: $(printf '%s' "$problem" | tr '"' "'")"
  printf '%s\n' "$check"
  exit 1
fi

# `--only` commits just these files, even if other changes happen to be staged.
if ! { git add -- "${entries[@]}" && git commit --quiet --only -m "journey: $dates" -- "${entries[@]}"; }; then
  say "Journey $dates: the commit failed. See ~/Library/Logs/portfolio-journey.log."
  exit 1
fi

if ! git push --quiet origin main 2>/dev/null; then
  # main moved on GitHub (another entry, a change from elsewhere): replay this commit on top.
  if ! { git pull --quiet --rebase --autostash origin main && git push --quiet origin main; }; then
    say "Journey $dates is committed but couldn't be pushed. Run: git push origin main"
    exit 1
  fi
fi

say "Published journey $dates. Live in about 5 minutes."
