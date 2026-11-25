#!/bin/bash
# Installs the launchd agent that runs scripts/journey-autopublish.sh whenever content/journey/
# changes. `--uninstall` removes it. macOS only; it runs while you're logged in.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.portfolio-website.journey-autopublish"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/portfolio-journey.log"
DOMAIN="gui/$(id -u)"

launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true

if [ "${1:-}" = --uninstall ]; then
  rm -f "$PLIST"
  echo "Removed the journey auto-publisher."
  exit 0
fi

# launchd starts with a bare PATH, so record where node and pnpm live. fnm's default alias is
# stable across shells; a per-shell fnm path would vanish.
if [ -x "$HOME/.local/share/fnm/aliases/default/bin/pnpm" ]; then
  NODE_BIN="$HOME/.local/share/fnm/aliases/default/bin"
elif command -v pnpm >/dev/null; then
  NODE_BIN="$(dirname "$(command -v pnpm)")"
else
  echo "pnpm isn't on PATH; install it first." >&2
  exit 1
fi

mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$REPO/scripts/journey-autopublish.sh</string>
  </array>
  <key>WatchPaths</key>
  <array>
    <string>$REPO/content/journey</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$NODE_BIN:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>StandardOutPath</key>
  <string>$LOG</string>
  <key>StandardErrorPath</key>
  <string>$LOG</string>
</dict>
</plist>
PLIST

launchctl bootstrap "$DOMAIN" "$PLIST"
echo "Installed. New entries in content/journey/ now publish on their own."
echo "Log: $LOG    Remove: pnpm journey:autopublish:uninstall"
