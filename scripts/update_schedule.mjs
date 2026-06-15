#!/usr/bin/env node
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outFile = path.join(root, "public", "schedule.json");
const backupFile = path.join(root, "public", "schedule.previous.json");
const sourceUrl = "https://www.matchesio.com/competition/world-cup/export/json/";
const timezone = "America/Los_Angeles";
const dryRun = process.argv.includes("--dry-run");

const knockoutVenueFallbacks = [
  ["Los Angeles", "SoFi Stadium"],
  ["Boston", "Gillette Stadium"],
  ["Monterrey", "Estadio BBVA"],
  ["Houston", "NRG Stadium"],
  ["New York New Jersey", "MetLife Stadium"],
  ["Dallas", "AT&T Stadium"],
  ["Mexico City", "Estadio Azteca"],
  ["Atlanta", "Mercedes-Benz Stadium"],
  ["San Francisco Bay Area", "Levi's Stadium"],
  ["Seattle", "Lumen Field"],
  ["Toronto", "BMO Field"],
  ["Los Angeles", "SoFi Stadium"],
  ["Vancouver", "BC Place"],
  ["Miami", "Hard Rock Stadium"],
  ["Kansas City", "Arrowhead Stadium"],
  ["Dallas", "AT&T Stadium"],
  ["Philadelphia", "Lincoln Financial Field"],
  ["Houston", "NRG Stadium"],
  ["New York New Jersey", "MetLife Stadium"],
  ["Mexico City", "Estadio Azteca"],
  ["Dallas", "AT&T Stadium"],
  ["Seattle", "Lumen Field"],
  ["Atlanta", "Mercedes-Benz Stadium"],
  ["Vancouver", "BC Place"],
  ["Boston", "Gillette Stadium"],
  ["Los Angeles", "SoFi Stadium"],
  ["Miami", "Hard Rock Stadium"],
  ["Kansas City", "Arrowhead Stadium"],
  ["Dallas", "AT&T Stadium"],
  ["Atlanta", "Mercedes-Benz Stadium"],
  ["Miami", "Hard Rock Stadium"],
  ["New York New Jersey", "MetLife Stadium"],
];

const nameMap = new Map([
  ["USA", "United States"],
  ["Congo DR", "DR Congo"],
  ["Cape Verde Islands", "Cape Verde"],
  ["Czech Republic", "Czechia"],
]);

const knownGoalEvents = new Map([
  [
    104456,
    [
      goal("9'", "Mexico", "Julián Quiñones", "胡利安·基尼奥内斯"),
      goal("67'", "Mexico", "Raúl Jiménez", "劳尔·希门尼斯"),
    ],
  ],
  [
    165651,
    [
      goal("59'", "Czechia", "Ladislav Krejcí", "拉迪斯拉夫·克雷伊奇"),
      goal("67'", "South Korea", "Hwang In-Beom", "黄仁范"),
      goal("80'", "South Korea", "Oh Hyeon-Gyu", "吴贤揆"),
    ],
  ],
  [
    165652,
    [
      goal("21'", "Bosnia & Herzegovina", "Jovo Lukic", "约沃·卢基奇"),
      goal("78'", "Canada", "Cyle Larin", "塞尔·拉林"),
    ],
  ],
  [
    104457,
    [
      goal("7'", "United States", "Damián Bobadilla", "达米安·博瓦迪利亚", "乌龙"),
      goal("31'", "United States", "Folarin Balogun", "弗拉林·巴洛贡"),
      goal("45'+5'", "United States", "Folarin Balogun", "弗拉林·巴洛贡"),
      goal("73'", "Paraguay", "Mauricio", "毛里西奥"),
      goal("90'+8'", "United States", "Giovanni Reyna", "吉奥·雷纳"),
    ],
  ],
  [104459, [goal("28'", "Scotland", "John McGinn", "约翰·麦金")]],
  [
    104458,
    [
      goal("21'", "Morocco", "Ismael Saibari", "伊斯梅尔·赛巴里"),
      goal("32'", "Brazil", "Vinícius Júnior", "维尼修斯·儒尼奥尔"),
    ],
  ],
  [
    104460,
    [
      goal("17'", "Switzerland", "Breel Embolo", "布雷尔·恩博洛", "点球"),
      goal("90'+4'", "Qatar", "Miro Muheim", "米罗·穆海姆", "乌龙"),
    ],
  ],
  [
    165653,
    [
      goal("27'", "Australia", "Nestory Irankunda", "内斯托里·伊兰昆达"),
      goal("75'", "Australia", "Connor Metcalfe", "康纳·梅特卡夫"),
    ],
  ],
  [
    104461,
    [
      goal("6'", "Germany", "Felix Nmecha", "菲利克斯·恩梅查"),
      goal("21'", "Curaçao", "Livano Comenencia", "利瓦诺·科梅嫩西亚"),
      goal("38'", "Germany", "Nico Schlotterbeck", "尼科·施洛特贝克"),
      goal("45'+5'", "Germany", "Kai Havertz", "凯·哈弗茨", "点球"),
      goal("47'", "Germany", "Jamal Musiala", "贾马尔·穆西亚拉"),
      goal("68'", "Germany", "Nathaniel Brown", "纳撒尼尔·布朗"),
      goal("78'", "Germany", "Deniz Undav", "德尼兹·翁达夫"),
      goal("88'", "Germany", "Kai Havertz", "凯·哈弗茨"),
    ],
  ],
  [104462, [goal("90'", "Ivory Coast", "Amad Diallo", "阿马德·迪亚洛")]],
  [
    165654,
    [
      goal("7'", "Sweden", "Yasin Ayari", "亚辛·阿亚里"),
      goal("30'", "Sweden", "Alexander Isak", "亚历山大·伊萨克"),
      goal("43'", "Tunisia", "Omar Rekik", "奥马尔·雷基克"),
      goal("59'", "Sweden", "Viktor Gyökeres", "维克托·哲凯赖什"),
      goal("84'", "Sweden", "Mattias Svanberg", "马蒂亚斯·斯万贝里"),
      goal("90'+6'", "Sweden", "Yasin Ayari", "亚辛·阿亚里"),
    ],
  ],
  [
    104463,
    [
      goal("51'", "Netherlands", "Virgil van Dijk", "维吉尔·范戴克"),
      goal("57'", "Japan", "Keito Nakamura", "中村敬斗"),
      goal("64'", "Netherlands", "Crysencio Summerville", "克里森西奥·萨默维尔"),
      goal("89'", "Japan", "Daichi Kamada", "镰田大地"),
    ],
  ],
]);

function goal(minute, team, player, playerZh, note) {
  return { minute, team, player, playerZh, ...(note ? { note } : {}) };
}

function normalizeTeam(team) {
  if (!team) return "TBD";
  return nameMap.get(team) || team;
}

function datePart(date, type) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .find((part) => part.type === type)?.value;
}

function localDate(date) {
  return `${datePart(date, "year")}-${datePart(date, "month")}-${datePart(date, "day")}`;
}

function localTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function localDay(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function deriveStage(match) {
  const label = `${match.homeTeam || ""} ${match.awayTeam || ""}`;
  const knockout = label.match(/\((Round of 32|Round of 16|Quarter-finals|Semi-finals|3rd Place Final|Final) #?\d*\)/);
  if (knockout) return knockout[1];
  if (typeof match.matchday === "number") return `Group stage · Matchday ${match.matchday}`;
  return "Knockout";
}

function isPlaceholder(match) {
  return /\bTBD\b/i.test(`${match.homeTeam || ""} ${match.awayTeam || ""}`);
}

function normalizeResult(result) {
  if (!result) return null;
  return String(result).replace("-", "–");
}

async function fetchSource() {
  const response = await fetch(sourceUrl, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`matchesio export failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function normalize(rawMatches) {
  if (!Array.isArray(rawMatches)) {
    throw new Error("matchesio export did not return an array");
  }

  const matches = rawMatches.map((match) => {
    const utcStart = new Date(`${match.date}T${match.time}:00Z`);
    if (Number.isNaN(utcStart.getTime())) {
      throw new Error(`invalid kickoff for match ${match.id}`);
    }
    const stage = deriveStage(match);
    return {
      id: Number(match.id),
      competition: match.competition || "World Cup",
      season: match.season || "2026",
      matchday: typeof match.matchday === "number" ? match.matchday : null,
      stage,
      utcStart: utcStart.toISOString(),
      localDate: localDate(utcStart),
      localTime: localTime(utcStart),
      localDay: localDay(utcStart),
      homeTeam: normalizeTeam(match.homeTeam),
      awayTeam: normalizeTeam(match.awayTeam),
      city: match.city || "",
      stadium: match.stadium || "",
      status: match.status || "To be played",
      result: normalizeResult(match.result),
      goalEvents: knownGoalEvents.get(Number(match.id)) || [],
      isKnockout: stage !== "Group stage · Matchday 1" && stage !== "Group stage · Matchday 2" && stage !== "Group stage · Matchday 3",
      isPlaceholder: isPlaceholder(match),
    };
  });

  matches.sort((a, b) => Date.parse(a.utcStart) - Date.parse(b.utcStart));
  let knockoutVenueIndex = 0;
  for (const match of matches) {
    if (!match.isKnockout) continue;
    const fallback = knockoutVenueFallbacks[knockoutVenueIndex];
    if (fallback && (!match.city || !match.stadium)) {
      [match.city, match.stadium] = fallback;
    }
    knockoutVenueIndex += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    timezone,
    source: "matchesio World Cup 2026 JSON export",
    sourceUrl,
    matches,
  };
}

function validatePayload(payload) {
  if (payload.matches.length !== 104) {
    throw new Error(`expected exactly 104 matches, got ${payload.matches.length}`);
  }

  for (const stage of ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"]) {
    if (!payload.matches.some((match) => match.stage.includes(stage))) {
      throw new Error(`missing knockout stage: ${stage}`);
    }
  }

  const missingVenue = payload.matches.filter((match) => !match.city || !match.stadium);
  if (missingVenue.length > 0) {
    throw new Error(`matches missing venue: ${missingVenue.map((match) => match.id).join(", ")}`);
  }
}

async function main() {
  const raw = await fetchSource();
  const payload = normalize(raw);
  validatePayload(payload);

  if (dryRun) {
    const today = payload.matches.filter((match) => match.localDate === "2026-06-12");
    console.log(`dry-run ok: ${payload.matches.length} matches, ${today.length} matches on 2026-06-12 PT`);
    return;
  }

  await mkdir(path.dirname(outFile), { recursive: true });
  try {
    await stat(outFile);
    await copyFile(outFile, backupFile);
  } catch {
    // First run has no previous snapshot to preserve.
  }
  await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`wrote ${payload.matches.length} matches to ${outFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
