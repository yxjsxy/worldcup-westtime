#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P2
# GATE_VERIFY: bash gates/feature-always-on-view.sh
# Verifies a persistent TV/desktop always-on display mode exists and builds.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

test -f src/main.ts || { echo "missing src/main.ts"; exit 1; }
test -f src/styles.css || { echo "missing src/styles.css"; exit 1; }

grep -q "worldcup-westtime.alwaysOn" src/main.ts || { echo "missing always-on persistence key"; exit 1; }
grep -q "toggleAlwaysOnMode" src/main.ts || { echo "missing always-on toggle handler"; exit 1; }
grep -q "always-on-toggle" src/main.ts || { echo "missing always-on toggle markup"; exit 1; }
grep -q "always-on-active" src/main.ts || { echo "missing always-on app class"; exit 1; }
grep -q "always-on-active" src/styles.css || { echo "missing always-on styles"; exit 1; }

npm run build

grep -R "Always-on" dist/index.html dist/assets >/dev/null || { echo "missing Always-on label in build"; exit 1; }
grep -R "always-on-toggle" dist/index.html dist/assets >/dev/null || { echo "missing always-on toggle in build"; exit 1; }
grep -R "worldcup-westtime.alwaysOn" dist/index.html dist/assets >/dev/null || { echo "missing persisted always-on key in build"; exit 1; }

echo "PASS always-on view gate"
