#!/usr/bin/env bash
# GATE_LEVEL: P2
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="${TMPDIR:-/tmp}/worldcup-source-health-$$"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT"

node scripts/check_schedule_sources.mjs \
  --schedule fixtures/source-health/schedule-primary.json \
  --espn fixtures/source-health/espn-scoreboard.json \
  --out "$TMP_DIR/source-health.json"

node - "$TMP_DIR/source-health.json" <<'NODE'
const fs = require("node:fs");
const health = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (health.status !== "warning") throw new Error(`expected warning status, got ${health.status}`);
if (health.checkedMatches !== 3) throw new Error(`expected 3 checked matches, got ${health.checkedMatches}`);
if (health.alerts.length !== 2) throw new Error(`expected 2 alerts, got ${health.alerts.length}`);
const codes = health.alerts.map((alert) => alert.code).sort();
if (codes.join(",") !== "result_mismatch,status_mismatch") throw new Error(`unexpected alert codes: ${codes}`);
if (!health.sources.includes("matchesio") || !health.sources.includes("espn")) throw new Error("missing source names");
NODE

node - "$TMP_DIR/source-health.json" "$TMP_DIR/schedule-with-health.json" <<'NODE'
const fs = require("node:fs");
const schedule = JSON.parse(fs.readFileSync("fixtures/source-health/schedule-primary.json", "utf8"));
schedule.sourceHealth = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
fs.writeFileSync(process.argv[3], JSON.stringify(schedule, null, 2));
NODE

npm run build
grep -R "数据源健康" dist/index.html dist/assets >/dev/null || { echo "missing source health panel text"; exit 1; }
grep -R "Cross-source alerts" dist/index.html dist/assets >/dev/null || { echo "missing cross-source alert text"; exit 1; }

echo "PASS WorldCup source health alerts gate"
