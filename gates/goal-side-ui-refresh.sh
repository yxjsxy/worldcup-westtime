#!/usr/bin/env bash
# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/goal-side-ui-refresh.sh
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

grep -q 'getGoalSide' src/main.ts
grep -q 'goal-side' src/main.ts
grep -q '左队' src/main.ts
grep -q '右队' src/main.ts
grep -q 'goal.home' src/styles.css
grep -q 'goal.away' src/styles.css
grep -q 'World Cup pulse' src/main.ts

echo "PASS goal side UI refresh gate"
