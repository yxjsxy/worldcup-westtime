#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P0
# GATE_VERIFY: bash gates/remove-goal-side-labels.sh

cd "$(dirname "$0")/.."

if rg -q '左队|右队|goal-side|sideLabel' src/main.ts; then
  echo "FAIL: goal side text labels still render in src/main.ts" >&2
  exit 1
fi

grep -q 'class="goal ${side}"' src/main.ts
grep -q 'goal.home' src/styles.css
grep -q 'goal.away' src/styles.css
npm run build >/tmp/worldcup-remove-goal-side-labels-build.log

echo "PASS remove goal side labels gate"
