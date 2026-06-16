#!/usr/bin/env bash
# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/espn-adjacent-date-goals.sh
set -euo pipefail

cd "$(dirname "$0")/.."

npm run update:schedule

node - <<'NODE'
const schedule = require("./public/schedule.json");
const match = schedule.matches.find((item) => item.id === 104465);
if (!match) throw new Error("Iran-New Zealand match missing");
if (match.result !== "2–2") throw new Error(`unexpected result: ${match.result}`);
const expected = [
  ["7'", "Elijah Just", "New Zealand"],
  ["32'", "Ramin Rezaeian", "Iran"],
  ["54'", "Elijah Just", "New Zealand"],
  ["64'", "Mohammad Mohebbi", "Iran"],
];
for (const [minute, player, team] of expected) {
  const found = match.goalEvents?.some((goal) => goal.minute === minute && goal.player === player && goal.team === team);
  if (!found) throw new Error(`missing goal event: ${minute} ${player} ${team}`);
}
NODE

echo "PASS ESPN adjacent-date goal sync gate"
