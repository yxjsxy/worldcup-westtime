#!/usr/bin/env bash
# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/played-match-goals.sh
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

grep -q '世界杯消息同步' src/main.ts
grep -q 'goalEvents' src/schedule.ts
grep -q 'renderGoalEvents' src/main.ts
grep -q '达米安·博瓦迪利亚' scripts/update_schedule.mjs
grep -q '阿马德·迪亚洛' scripts/update_schedule.mjs
grep -q '进球详情待同步' src/main.ts

node - <<'NODE'
const schedule = require("./public/schedule.json");
const usa = schedule.matches.find((match) => match.id === 104457);
if (!usa?.goalEvents?.some((goal) => goal.playerZh === "弗拉林·巴洛贡" && goal.minute === "31'")) {
  throw new Error("USA-Paraguay Balogun goal event missing");
}
NODE

echo "PASS played match goals gate"
