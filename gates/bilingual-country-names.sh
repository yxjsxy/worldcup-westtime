#!/usr/bin/env bash
# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/bilingual-country-names.sh
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

grep -q 'function formatTeamName' src/schedule.ts
grep -q 'formatTeamName(match.homeTeam)' src/schedule.ts
grep -q 'formatTeamName(match.awayTeam)' src/schedule.ts
grep -q 'United States", "美国' src/schedule.ts
grep -q 'Brazil", "巴西' src/schedule.ts
grep -q 'TBD Home' src/schedule.ts

echo "PASS bilingual country names gate"
