#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));

if (!args.schedule || !args.espn || !args.out) {
  console.error("usage: node scripts/check_schedule_sources.mjs --schedule <schedule.json> --espn <scoreboard.json> --out <source-health.json>");
  process.exit(1);
}

const teamAliases = new Map([
  ["usa", "unitedstates"],
  ["korearepublic", "southkorea"],
  ["cotedivoire", "ivorycoast"],
]);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    parsed[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return parsed;
}

function comparableName(name) {
  const folded = String(name || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z]/g, "");
  return teamAliases.get(folded) || folded;
}

function normalizeResult(result) {
  return result ? String(result).replace("-", "–") : null;
}

function espnTeams(event) {
  return (event.competitions?.[0]?.competitors || []).map((competitor) => comparableName(competitor.team?.displayName));
}

function findEspnEvent(match, events) {
  const expected = [comparableName(match.homeTeam), comparableName(match.awayTeam)].sort().join("|");
  return events.find((event) => espnTeams(event).sort().join("|") === expected);
}

function espnResult(event) {
  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find((competitor) => competitor.homeAway === "home");
  const away = competitors.find((competitor) => competitor.homeAway === "away");
  if (!home || !away || home.score == null || away.score == null) return null;
  return `${home.score}–${away.score}`;
}

function statusFromEspn(event) {
  return event.status?.type?.completed ? "Played" : "To be played";
}

function buildAlert(code, severity, match, message, primaryValue, secondaryValue) {
  return {
    code,
    severity,
    matchId: match.id,
    match: `${match.homeTeam} vs ${match.awayTeam}`,
    message,
    primaryValue,
    secondaryValue,
  };
}

const schedule = JSON.parse(await readFile(args.schedule, "utf8"));
const espn = JSON.parse(await readFile(args.espn, "utf8"));
const events = Array.isArray(espn.events) ? espn.events : [];
const alerts = [];
let checkedMatches = 0;

for (const match of schedule.matches || []) {
  if (match.isPlaceholder) continue;
  const event = findEspnEvent(match, events);
  if (!event) {
    alerts.push(buildAlert("missing_secondary_match", "medium", match, "ESPN scoreboard did not contain this match.", match.utcStart, null));
    continue;
  }
  checkedMatches += 1;

  const secondaryStatus = statusFromEspn(event);
  if (match.status !== secondaryStatus) {
    alerts.push(buildAlert("status_mismatch", "high", match, "Primary and ESPN disagree on match status.", match.status, secondaryStatus));
  }

  const primaryResult = normalizeResult(match.result);
  const secondaryResult = espnResult(event);
  if (primaryResult && secondaryResult && primaryResult !== secondaryResult) {
    alerts.push(buildAlert("result_mismatch", "high", match, "Primary and ESPN disagree on final score.", primaryResult, secondaryResult));
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  status: alerts.some((item) => item.severity === "high") ? "warning" : alerts.length ? "notice" : "ok",
  sources: [schedule.source || "primary", espn.source || "espn"],
  checkedMatches,
  alertCount: alerts.length,
  alerts,
};

await writeFile(path.resolve(args.out), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`wrote source health: ${payload.status}, ${payload.alertCount} alerts, ${checkedMatches} checked matches`);
