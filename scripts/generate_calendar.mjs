#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const scheduleFile = path.join(root, "public", "schedule.json");
const calendarFile = path.join(root, "public", "worldcup-westtime.ics");
const productUrl = "https://worldcup-westtime.vercel.app";

function escapeText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(line) {
  const chars = [...line];
  const lines = [];
  let current = "";
  for (const char of chars) {
    if ([...current, char].join("").length > 73) {
      lines.push(current);
      current = ` ${char}`;
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines.join("\r\n");
}

function toIcsDate(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function addMinutes(iso, minutes) {
  return toIcsDate(new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString());
}

function calendarDescription(match) {
  const location = [match.city, match.stadium].filter(Boolean).join(" · ") || "Venue TBD";
  const score = match.result ? `Score: ${match.result}` : `Status: ${match.status}`;
  const goals = (match.goalEvents || [])
    .map((goal) => `${goal.minute} ${goal.playerZh || goal.player}${goal.note ? ` (${goal.note})` : ""}`)
    .join("; ");
  return [
    `${match.stage}`,
    score,
    `City / venue: ${location}`,
    goals ? `Goals: ${goals}` : "",
    `Open: ${productUrl}`,
  ]
    .filter(Boolean)
    .join("\\n");
}

const payload = JSON.parse(await readFile(scheduleFile, "utf8"));
const stamp = toIcsDate(payload.generatedAt || new Date().toISOString());
const lines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//WorldCup WestTime//FIFA 2026 PT Schedule//EN",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "X-WR-CALNAME:WorldCup WestTime",
  "X-WR-TIMEZONE:America/Los_Angeles",
];

for (const match of payload.matches) {
  const location = [match.city, match.stadium].filter(Boolean).join(" · ") || "Venue TBD";
  lines.push(
    "BEGIN:VEVENT",
    `UID:worldcup-westtime-${match.id}@worldcup-westtime.vercel.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsDate(match.utcStart)}`,
    `DTEND:${addMinutes(match.utcStart, 120)}`,
    `SUMMARY:${escapeText(`${match.homeTeam} vs ${match.awayTeam}`)}`,
    `DESCRIPTION:${escapeText(calendarDescription(match))}`,
    `LOCATION:${escapeText(location)}`,
    `URL:${productUrl}`,
    "END:VEVENT",
  );
}

lines.push("BEGIN:VEVENT");
lines.push("UID:worldcup-westtime-final-buffer@worldcup-westtime.vercel.app");
lines.push(`DTSTAMP:${stamp}`);
lines.push("DTSTART;VALUE=DATE:20260720");
lines.push("SUMMARY:WorldCup WestTime tournament wrap");
lines.push(`DESCRIPTION:${escapeText(`Tournament calendar completed. Open: ${productUrl}`)}`);
lines.push(`URL:${productUrl}`);
lines.push("END:VEVENT");
lines.push("END:VCALENDAR");

await writeFile(calendarFile, `${lines.map(foldLine).join("\r\n")}\r\n`);
console.log(`Generated ${path.relative(root, calendarFile)} with ${payload.matches.length} matches.`);
