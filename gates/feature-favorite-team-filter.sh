#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/feature-favorite-team-filter.sh
# Verifies favorite-team filtering is implemented, persisted, and buildable.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

test -f src/main.ts || { echo "missing src/main.ts"; exit 1; }
test -f src/styles.css || { echo "missing src/styles.css"; exit 1; }

grep -q "favorite-team" src/main.ts || { echo "missing favorite team control markup"; exit 1; }
grep -q "worldcup-westtime.favoriteTeam" src/main.ts || { echo "missing persisted favorite-team key"; exit 1; }
grep -q "filterMatchesByTeam" src/main.ts || { echo "missing team filter function"; exit 1; }
grep -q "changeFavoriteTeam" src/main.ts || { echo "missing favorite-team change handler"; exit 1; }
grep -q "favorite-filter" src/styles.css || { echo "missing favorite filter styles"; exit 1; }

npm run build

grep -R "收藏球队" dist/index.html dist/assets >/dev/null || { echo "missing 收藏球队 text in build"; exit 1; }
grep -R "favorite-team" dist/index.html dist/assets >/dev/null || { echo "missing favorite-team control in build"; exit 1; }
grep -R "worldcup-westtime.favoriteTeam" dist/index.html dist/assets >/dev/null || { echo "missing localStorage key in build"; exit 1; }
grep -R "All teams" dist/index.html dist/assets >/dev/null || { echo "missing all-teams option in build"; exit 1; }

node -e "
const data = require('./public/schedule.json');
const teams = new Set(data.matches.flatMap((m) => [m.homeTeam, m.awayTeam]).filter((team) => !team.startsWith('TBD')));
if (!teams.has('United States')) throw new Error('fixture missing United States for favorite filter');
if ([...teams].length < 24) throw new Error('expected broad team options, got ' + teams.size);
"

echo "PASS favorite team filter gate"
