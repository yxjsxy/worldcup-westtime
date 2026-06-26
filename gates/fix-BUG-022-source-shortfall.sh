#!/usr/bin/env bash
set -euo pipefail

# GATE_LEVEL: P1
# GATE_VERIFY: bash gates/fix-BUG-022-source-shortfall.sh
# Verifies schedule refresh survives a partially missing upstream export by
# keeping the canonical 104-match snapshot complete and recording source health.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="${TMPDIR:-/tmp}/worldcup-bug-022-$$"
mkdir -p "$TMP_DIR"

cd "$ROOT"

cp public/schedule.json "$TMP_DIR/schedule.json"
if [ -f public/schedule.previous.json ]; then
  cp public/schedule.previous.json "$TMP_DIR/schedule.previous.json"
fi

restore() {
  cp "$TMP_DIR/schedule.json" public/schedule.json
  if [ -f "$TMP_DIR/schedule.previous.json" ]; then
    cp "$TMP_DIR/schedule.previous.json" public/schedule.previous.json
  fi
  rm -rf "$TMP_DIR"
}
trap restore EXIT

npm run update:schedule -- --dry-run
npm run update:schedule

node <<'NODE'
const fs = require("node:fs");
const data = JSON.parse(fs.readFileSync("public/schedule.json", "utf8"));
if (!Array.isArray(data.matches)) throw new Error("matches is not an array");
if (data.matches.length !== 104) throw new Error(`expected 104 matches, got ${data.matches.length}`);
const ids = new Set(data.matches.map((match) => match.id));
if (ids.size !== data.matches.length) throw new Error("duplicate match ids after fallback merge");
for (const stage of ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "3rd Place Final", "Final"]) {
  if (!data.matches.some((match) => String(match.stage).includes(stage))) {
    throw new Error(`missing knockout stage: ${stage}`);
  }
}
if (!data.sourceHealth) throw new Error("missing sourceHealth");
if (!["ok", "warning"].includes(data.sourceHealth.status)) {
  throw new Error(`unexpected sourceHealth status: ${data.sourceHealth.status}`);
}
if (data.sourceHealth.upstreamMatches < 100) {
  throw new Error(`unexpectedly low upstream match count: ${data.sourceHealth.upstreamMatches}`);
}
if (data.sourceHealth.upstreamMatches < 104) {
  if (data.sourceHealth.status !== "warning") {
    throw new Error("short upstream export must produce warning sourceHealth");
  }
  if (data.sourceHealth.fallbackMatches !== 104 - data.sourceHealth.upstreamMatches) {
    throw new Error(`expected fallbackMatches ${104 - data.sourceHealth.upstreamMatches}, got ${data.sourceHealth.fallbackMatches}`);
  }
  if (!Array.isArray(data.sourceHealth.alerts) || !data.sourceHealth.alerts.some((alert) => alert.code === "upstream_match_shortfall")) {
    throw new Error("missing upstream_match_shortfall alert");
  }
}
NODE

echo "PASS BUG-022 source shortfall fallback gate"
