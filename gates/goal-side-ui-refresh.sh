#!/usr/bin/env bash
# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/goal-side-ui-refresh.sh
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

grep -q 'getGoalSide' src/main.ts
if rg -q 'goal-side|左队|右队' src/main.ts; then
  echo "FAIL: goal side labels should not render" >&2
  exit 1
fi
grep -q 'goal.home' src/styles.css
grep -q 'goal.away' src/styles.css
grep -q 'World Cup pulse' src/main.ts

echo "PASS goal side UI refresh gate"
