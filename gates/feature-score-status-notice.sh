#!/usr/bin/env bash
# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/feature-score-status-notice.sh
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

grep -q "renderScoreStatusNotice" src/main.ts
grep -q "赛后更新" src/main.ts
grep -q "Final score" src/main.ts
grep -q "score-notice" src/styles.css
grep -q "goals synced" src/main.ts

grep -R "赛后更新" dist/index.html dist/assets >/dev/null || { echo "missing score notice copy in build"; exit 1; }
grep -R "Final score" dist/index.html dist/assets >/dev/null || { echo "missing final score copy in build"; exit 1; }

node - <<'NODE'
const schedule = require("./public/schedule.json");
const played = schedule.matches.filter((match) => match.status === "Played" && match.result);
if (played.length < 10) {
  throw new Error(`expected at least 10 played matches, got ${played.length}`);
}
const withGoals = played.filter((match) => Array.isArray(match.goalEvents) && match.goalEvents.length > 0);
if (withGoals.length < 8) {
  throw new Error(`expected at least 8 played matches with goals, got ${withGoals.length}`);
}
NODE

echo "PASS score status notice gate"
