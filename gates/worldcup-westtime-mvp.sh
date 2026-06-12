#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P0
# GATE_VERIFY: bash gates/worldcup-westtime-mvp.sh
# Checks the WorldCup WestTime app, data refresh path, and KarlHub registration.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HUB="/Users/karlkarl/Documents/vibe_coding/karl-hub"

cd "$ROOT"

test -f package.json || { echo "missing package.json"; exit 1; }
test -f src/schedule.ts || { echo "missing src/schedule.ts"; exit 1; }
test -f src/main.ts || { echo "missing src/main.ts"; exit 1; }
test -f public/schedule.json || { echo "missing public/schedule.json"; exit 1; }
test -f scripts/update_schedule.mjs || { echo "missing update script"; exit 1; }

node -e "
const data = require('./public/schedule.json');
if (!Array.isArray(data.matches)) throw new Error('matches is not an array');
if (data.matches.length < 70) throw new Error('expected at least 70 matches, got ' + data.matches.length);
for (const key of ['generatedAt','timezone','source']) {
  if (!data[key]) throw new Error('missing ' + key);
}
const today = data.matches.filter((m) => m.localDate === '2026-06-12');
if (today.length < 2) throw new Error('expected Jun 12 PT matches');
const usa = data.matches.find((m) => /United States/.test(m.homeTeam + m.awayTeam) && m.localDate === '2026-06-12');
if (!usa) throw new Error('missing USA Jun 12 fixture');
const knockout = data.matches.find((m) => m.stage && /Round of 32/.test(m.stage));
if (!knockout) throw new Error('missing knockout placeholder fixtures');
"

npm run build
npm run update:schedule -- --dry-run

grep -R "今日赛程" dist/index.html dist/assets >/dev/null || { echo "missing 今日赛程 text"; exit 1; }
grep -R "未来赛程" dist/index.html dist/assets >/dev/null || { echo "missing 未来赛程 text"; exit 1; }
grep -R "美西时间" dist/index.html dist/assets >/dev/null || { echo "missing 美西时间 text"; exit 1; }
grep -R "Deployed in" dist/index.html dist/assets >/dev/null || { echo "missing deploy timestamp"; exit 1; }

grep -q "worldcup-westtime" "$HUB/lib/apps.ts" || { echo "KarlHub entry missing"; exit 1; }
grep -q "WorldCup WestTime" "$HUB/lib/apps.ts" || { echo "KarlHub name missing"; exit 1; }

echo "WorldCup WestTime MVP gate passed."
