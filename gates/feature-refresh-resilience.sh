#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P0
# GATE_VERIFY: bash gates/feature-refresh-resilience.sh
# Checks schedule refresh resilience, stale-data UI, and Vercel cache headers.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

test -f vercel.json || { echo "missing vercel.json"; exit 1; }
test -f public/schedule.json || { echo "missing public/schedule.json"; exit 1; }
test -f scripts/update_schedule.mjs || { echo "missing update script"; exit 1; }

node -e "
const fs = require('node:fs');
const data = require('./public/schedule.json');
if (!Array.isArray(data.matches)) throw new Error('matches is not an array');
if (data.matches.length !== 104) throw new Error('expected exactly 104 matches, got ' + data.matches.length);
for (const stage of ['Round of 32','Round of 16','Quarter-finals','Semi-finals','Final']) {
  if (!data.matches.some((m) => String(m.stage).includes(stage))) throw new Error('missing knockout stage ' + stage);
}
const config = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));
const headers = config.headers || [];
const scheduleHeader = headers.find((entry) => entry.source === '/schedule.json');
if (!scheduleHeader) throw new Error('missing /schedule.json header rule');
const cache = (scheduleHeader.headers || []).find((h) => h.key.toLowerCase() === 'cache-control');
if (!cache || !/max-age=0/.test(cache.value) || !/must-revalidate/.test(cache.value)) {
  throw new Error('schedule.json Cache-Control must disable stale CDN caching');
}
"

npm run update:schedule -- --dry-run
npm run build

grep -R "数据可能已过期" dist/index.html dist/assets >/dev/null || { echo "missing stale schedule warning"; exit 1; }
grep -R "Schedule freshness" dist/index.html dist/assets >/dev/null || { echo "missing freshness label"; exit 1; }

echo "WorldCup WestTime refresh resilience gate passed."
