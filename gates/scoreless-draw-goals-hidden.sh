#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P0
# GATE_VERIFY: bash gates/scoreless-draw-goals-hidden.sh

cd "$(dirname "$0")/.."

grep -q 'isScorelessDraw' src/main.ts
grep -q '进球详情待同步' src/main.ts

node --input-type=module <<'NODE'
import fs from "node:fs";

const schedule = JSON.parse(fs.readFileSync("public/schedule.json", "utf8"));
const match = schedule.matches.find(
  (item) => item.homeTeam === "Spain" && item.awayTeam === "Cape Verde" && item.status === "Played",
);

if (!match) {
  throw new Error("Spain vs Cape Verde played match missing");
}

if (match.result !== "0–0") {
  throw new Error(`Expected Spain vs Cape Verde to be 0–0, got ${match.result}`);
}

if ((match.goalEvents || []).length !== 0) {
  throw new Error("Scoreless draw should not have goal events");
}
NODE

npm run build >/tmp/worldcup-scoreless-draw-build.log

echo "PASS scoreless draw goals hidden gate"
