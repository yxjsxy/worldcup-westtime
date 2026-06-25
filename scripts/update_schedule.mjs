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
  ["IR Iran", "Iran"],
  ["Korea Republic", "South Korea"],
  ["Bosnia-Herzegovina", "Bosnia & Herzegovina"],
  ["Côte d'Ivoire", "Ivory Coast"],
  ["Congo DR", "DR Congo"],
  ["Cape Verde Islands", "Cape Verde"],
  ["Czech Republic", "Czechia"],
]);

const teamAliases = new Map([
  ["usa", "unitedstates"],
  ["korearepublic", "southkorea"],
  ["bosniaherzegovina", "bosniaherzegovina"],
  ["cotedivoire", "ivorycoast"],
  ["czechrepublic", "czechia"],
]);

const playerNameZh = new Map([
  ["Julián Quiñones", "胡利安·基尼奥内斯"],
  ["Raúl Jiménez", "劳尔·希门尼斯"],
  ["Cristiano Ronaldo", "克里斯蒂亚诺·罗纳尔多"],
  ["Nuno Mendes", "努诺·门德斯"],
  ["Abduvokhid Nematov", "阿卜杜沃希德·内马托夫"],
  ["Rafael Leão", "拉斐尔·莱奥"],
  ["João Neves", "若昂·内维斯"],
  ["Yoane Wissa", "约安·维萨"],
  ["Ladislav Krejcí", "拉迪斯拉夫·克雷伊奇"],
  ["Hwang In-Beom", "黄仁范"],
  ["Oh Hyeon-Gyu", "吴贤揆"],
  ["Jovo Lukic", "约沃·卢基奇"],
  ["Cyle Larin", "塞尔·拉林"],
  ["Damián Bobadilla", "达米安·博瓦迪利亚"],
  ["Folarin Balogun", "弗拉林·巴洛贡"],
  ["Cameron Burgess", "卡梅伦·伯吉斯"],
  ["Alex Freeman", "亚历克斯·弗里曼"],
  ["Mauricio", "毛里西奥"],
  ["Matías Galarza", "马蒂亚斯·加拉尔萨"],
  ["Giovanni Reyna", "吉奥·雷纳"],
  ["John McGinn", "约翰·麦金"],
  ["Yassine Bounou", "亚辛·布努"],
  ["Achraf Hakimi", "阿什拉夫·哈基米"],
  ["Wilson Isidor", "威尔逊·伊西多尔"],
  ["Ismael Saibari", "伊斯梅尔·赛巴里"],
  ["Soufiane Rahimi", "苏菲安·拉希米"],
  ["Gessime Yassine", "杰西姆·亚辛"],
  ["Matheus Cunha", "马特乌斯·库尼亚"],
  ["Vinícius Júnior", "维尼修斯·儒尼奥尔"],
  ["Breel Embolo", "布雷尔·恩博洛"],
  ["Johan Manzambi", "约翰·曼赞比"],
  ["Rubén Vargas", "鲁本·巴尔加斯"],
  ["Promise David", "普罗米斯·戴维"],
  ["Kerim Alajbegovic", "凯里姆·阿拉伊贝戈维奇"],
  ["Mahmoud Abunada", "马哈茂德·阿布纳达"],
  ["Hassan Al Haydos", "哈桑·海多斯"],
  ["Ermin Mahmic", "埃尔明·马赫米奇"],
  ["Granit Xhaka", "格拉尼特·扎卡"],
  ["Miro Muheim", "米罗·穆海姆"],
  ["Nestory Irankunda", "内斯托里·伊兰昆达"],
  ["Connor Metcalfe", "康纳·梅特卡夫"],
  ["Felix Nmecha", "菲利克斯·恩梅查"],
  ["Livano Comenencia", "利瓦诺·科梅嫩西亚"],
  ["Nico Schlotterbeck", "尼科·施洛特贝克"],
  ["Kai Havertz", "凯·哈弗茨"],
  ["Jamal Musiala", "贾马尔·穆西亚拉"],
  ["Nathaniel Brown", "纳撒尼尔·布朗"],
  ["Deniz Undav", "德尼兹·翁达夫"],
  ["Franck Kessie", "弗兰克·凯西"],
  ["Amad Diallo", "阿马德·迪亚洛"],
  ["Yasin Ayari", "亚辛·阿亚里"],
  ["Alexander Isak", "亚历山大·伊萨克"],
  ["Omar Rekik", "奥马尔·雷基克"],
  ["Viktor Gyökeres", "维克托·哲凯赖什"],
  ["Caleb Yirenkyi", "卡莱布·伊伦基"],
  ["Mattias Svanberg", "马蒂亚斯·斯万贝里"],
  ["Virgil van Dijk", "维吉尔·范戴克"],
  ["Keito Nakamura", "中村敬斗"],
  ["Brian Brobbey", "布赖恩·布罗贝"],
  ["Cody Gakpo", "科迪·加克波"],
  ["Anthony Elanga", "安东尼·埃兰加"],
  ["Crysencio Summerville", "克里森西奥·萨默维尔"],
  ["Daichi Kamada", "镰田大地"],
  ["Ayase Ueda", "上田绮世"],
  ["Junya Ito", "伊东纯也"],
  ["Emam Ashour", "埃马姆·阿舒尔"],
  ["Mohamed Hany", "穆罕默德·哈尼"],
  ["Abdulelah Al Amri", "阿卜杜勒拉赫·阿姆里"],
  ["Kevin Pina", "凯文·皮纳"],
  ["Maxi Araújo", "马克西·阿劳霍"],
  ["Agustín Canobbio", "阿古斯丁·卡诺比奥"],
  ["Hélio Varela", "埃利奥·瓦雷拉"],
  ["Elijah Just", "伊莱贾·贾斯特"],
  ["Ramin Rezaeian", "拉明·雷扎伊安"],
  ["Mohammad Mohebbi", "穆罕默德·穆赫比"],
  ["Kylian Mbappé", "基利安·姆巴佩"],
  ["Ousmane Dembélé", "奥斯曼·登贝莱"],
  ["Bradley Barcola", "布拉德利·巴尔科拉"],
  ["Ibrahim Mbaye", "易卜拉欣·姆巴耶"],
  ["Marcus Pedersen", "马库斯·佩德森"],
  ["Ismaïla Sarr", "伊斯梅拉·萨尔"],
  ["Lamine Yamal", "拉明·亚马尔"],
  ["Mikel Oyarzabal", "米克尔·奥亚萨瓦尔"],
  ["Hassan Al Tambakti", "哈桑·坦巴克蒂"],
  ["Jonathan David", "乔纳森·戴维"],
  ["Nathan Saliba", "纳森·萨利巴"],
  ["Mohammad Al Manai", "穆罕默德·阿勒马奈"],
  ["Erling Haaland", "埃尔林·哈兰德"],
  ["Aymen Hussein", "艾曼·侯赛因"],
  ["Leo Østigård", "莱奥·厄斯蒂高"],
  ["Lionel Messi", "莱昂内尔·梅西"],
  ["Romano Schmid", "罗马诺·施密德"],
  ["Ali Olwan", "阿里·奥尔万"],
  ["Yazan Al Arab", "亚赞·阿拉伯"],
  ["Marko Arnautovic", "马尔科·阿瑙托维奇"],
  ["Harry Kane", "哈里·凯恩"],
  ["Ante Budimir", "安特·布迪米尔"],
  ["Martin Baturina", "马丁·巴图里纳"],
  ["Petar Musa", "佩塔尔·穆萨"],
  ["Jude Bellingham", "裘德·贝林厄姆"],
  ["Marcus Rashford", "马库斯·拉什福德"],
  ["Daniel Muñoz", "丹尼尔·穆尼奥斯"],
  ["Abbosbek Fayzullaev", "阿博斯别克·法伊祖拉耶夫"],
  ["Luis Díaz", "路易斯·迪亚斯"],
  ["Luis Romo", "路易斯·罗莫"],
  ["Jaminton Campaz", "哈明顿·坎帕斯"],
  ["Michal Sadílek", "米哈尔·萨迪莱克"],
  ["Teboho Mokoena", "特博霍·莫科纳"],
  ["Finn Surman", "芬恩·瑟曼"],
  ["Mostafa Zico", "穆斯塔法·齐科"],
  ["Mohamed Salah", "穆罕默德·萨拉赫"],
  ["Trezeguet", "特雷泽盖"],
  ["Nizar Al Rashdan", "尼扎尔·拉什丹"],
  ["Nadhir Benbouali", "纳迪尔·本布阿利"],
  ["Amine Gouiri", "阿明·古伊里"],
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

function comparableName(name) {
  const folded = normalizeTeam(name)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z]/g, "");
  return teamAliases.get(folded) || folded;
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

async function fetchEspnScoreboard(dateKey) {
  const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateKey}`);
  if (!response.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload.events) ? payload.events : [];
}

async function fetchEspnSummary(eventId) {
  const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`);
  if (!response.ok) return null;
  return response.json();
}

function utcDateKey(isoDate) {
  return isoDate.slice(0, 10).replaceAll("-", "");
}

function localDateKey(match) {
  return match.localDate.replaceAll("-", "");
}

function espnDateKeys(match) {
  return [...new Set([utcDateKey(match.utcStart), localDateKey(match)])];
}

function matchEspnEvent(match, events) {
  const expected = new Set([comparableName(match.homeTeam), comparableName(match.awayTeam)]);
  return events.find((event) => {
    const competitors = event.competitions?.[0]?.competitors || [];
    const actual = new Set(competitors.map((competitor) => comparableName(competitor.team?.displayName || "")));
    return [...expected].every((team) => actual.has(team));
  });
}

function parseGoalEvent(match, event) {
  const type = event.type?.text || "";
  if (!/Goal|Penalty - Scored|Own Goal/i.test(type)) return null;
  const minute = event.clock?.displayValue || "";
  const text = event.text || "";
  let player = "";
  let team = "";
  let note = "";

  const ownGoal = text.match(/^Own Goal by ([^,]+), ([^.]+)\./);
  if (ownGoal) {
    let playerTeam;
    [, player, playerTeam] = ownGoal;
    const normalizedPlayerTeam = normalizeTeam(playerTeam.trim());
    team = normalizedPlayerTeam === match.homeTeam ? match.awayTeam : match.homeTeam;
    note = "乌龙";
  } else {
    const scorer = text.match(/\. ([^(]+) \(([^)]+)\)/);
    if (!scorer) return null;
    [, player, team] = scorer;
    if (/Penalty - Scored/i.test(type)) note = "点球";
  }

  const normalizedPlayer = player.trim();
  return goal(minute, normalizeTeam(team.trim()), normalizedPlayer, playerNameZh.get(normalizedPlayer) || normalizedPlayer, note);
}

async function enrichGoalEvents(matches) {
  const scoreboardCache = new Map();
  for (const match of matches) {
    if (match.status !== "Played" || match.isPlaceholder) {
      match.goalEvents = [];
      continue;
    }

    let espnEvent = null;
    for (const dateKey of espnDateKeys(match)) {
      if (!scoreboardCache.has(dateKey)) {
        scoreboardCache.set(dateKey, await fetchEspnScoreboard(dateKey));
      }
      espnEvent = matchEspnEvent(match, scoreboardCache.get(dateKey));
      if (espnEvent) break;
    }

    if (!espnEvent?.id) {
      match.goalEvents = knownGoalEvents.get(match.id) || [];
      continue;
    }

    const summary = await fetchEspnSummary(espnEvent.id);
    const parsed = (summary?.keyEvents || []).map((event) => parseGoalEvent(match, event)).filter(Boolean);
    match.goalEvents = parsed.length > 0 ? parsed : knownGoalEvents.get(match.id) || [];
  }
}

async function normalize(rawMatches) {
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
      goalEvents: [],
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

  await enrichGoalEvents(matches);

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
  const payload = await normalize(raw);
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
