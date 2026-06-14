#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/feature-match-locations.sh
# Ensures every match has city/stadium data and key schedule surfaces render venue text.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

node -e "
const data = require('./public/schedule.json');
if (!Array.isArray(data.matches) || data.matches.length < 70) {
  throw new Error('schedule.json has too few matches');
}
const missing = data.matches.filter((match) => !match.city || !match.stadium);
if (missing.length) {
  throw new Error('matches missing city/stadium: ' + missing.slice(0, 5).map((m) => m.id).join(', '));
}
"

grep -q "function getMatchLocation" src/main.ts || { echo "missing getMatchLocation helper"; exit 1; }
grep -q "next-location" src/main.ts || { echo "next-card location is not rendered"; exit 1; }
grep -q "knockout-location" src/main.ts || { echo "knockout location is not rendered"; exit 1; }
grep -q "City / venue" src/main.ts || { echo "location label missing"; exit 1; }

npm run build

grep -R "City / venue" dist/index.html dist/assets >/dev/null || { echo "built app missing location label"; exit 1; }
grep -R "next-location" dist/index.html dist/assets >/dev/null || { echo "built app missing next-card location"; exit 1; }
grep -R "knockout-location" dist/index.html dist/assets >/dev/null || { echo "built app missing knockout location"; exit 1; }

echo "Match location gate passed."
