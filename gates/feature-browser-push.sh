#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P2
# GATE_VERIFY: bash gates/feature-browser-push.sh
# Verifies browser notification reminder UI, service worker registration, and build output.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

test -f src/main.ts || { echo "missing src/main.ts"; exit 1; }
test -f public/reminder-sw.js || { echo "missing public/reminder-sw.js"; exit 1; }

grep -q "worldcup-westtime.pushEnabled" src/main.ts || { echo "missing push preference storage key"; exit 1; }
grep -q "Notification.permission" src/main.ts || { echo "missing Notification permission handling"; exit 1; }
grep -q "navigator.serviceWorker.register" src/main.ts || { echo "missing service worker registration"; exit 1; }
grep -q "showNotification" src/main.ts || { echo "missing browser reminder notification call"; exit 1; }
grep -q "提醒" src/main.ts || { echo "missing reminder UI copy"; exit 1; }
grep -q "notificationclick" public/reminder-sw.js || { echo "missing notification click handler"; exit 1; }

npm run build

grep -R "提醒" dist/index.html dist/assets >/dev/null || { echo "missing reminder UI in build"; exit 1; }
grep -R "worldcup-westtime.pushEnabled" dist/index.html dist/assets >/dev/null || { echo "missing push preference in build"; exit 1; }
test -f dist/reminder-sw.js || { echo "missing built reminder service worker"; exit 1; }

echo "PASS browser push reminders gate"
