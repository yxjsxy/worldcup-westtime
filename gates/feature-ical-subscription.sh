#!/usr/bin/env bash
# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/feature-ical-subscription.sh
set -euo pipefail

cd "$(dirname "$0")/.."

npm run calendar
npm run build

test -f public/worldcup-westtime.ics || { echo "missing generated iCal file"; exit 1; }

grep -q "BEGIN:VCALENDAR" public/worldcup-westtime.ics
grep -q "X-WR-TIMEZONE:America/Los_Angeles" public/worldcup-westtime.ics
grep -q "WorldCup WestTime" public/worldcup-westtime.ics
grep -q "City / venue" public/worldcup-westtime.ics
grep -q "VALUE=DATE:20260720" public/worldcup-westtime.ics
grep -q "worldcup-westtime.ics" src/main.ts
grep -q "加入日历" src/main.ts

node - <<'NODE'
const fs = require("node:fs");
const calendar = fs.readFileSync("public/worldcup-westtime.ics", "utf8");
const schedule = JSON.parse(fs.readFileSync("public/schedule.json", "utf8"));
const events = calendar.match(/BEGIN:VEVENT/g) || [];
const expectedEvents = schedule.matches.length + 1;
if (events.length !== expectedEvents) {
  throw new Error(`expected ${expectedEvents} events, got ${events.length}`);
}
if (!/SUMMARY:.* vs .*/.test(calendar)) {
  throw new Error("missing match summary");
}
if (!/URL:https:\/\/worldcup-westtime\.vercel\.app/.test(calendar)) {
  throw new Error("missing production URL");
}
NODE

echo "PASS iCal subscription gate"
