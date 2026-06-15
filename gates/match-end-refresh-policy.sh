#!/usr/bin/env bash
# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/match-end-refresh-policy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

grep -q "赛后自动刷新" src/main.ts
grep -q "match-end refresh" README.md
grep -q "每场比赛结束后刷新" roadmap.md
! grep -q "Daily 08:00 refresh" src/main.ts
! grep -q "daily 08:00 cron" README.md

echo "PASS match-end refresh policy gate"
