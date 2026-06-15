export type MatchStatus = "Played" | "To be played" | string;

export interface GoalEvent {
  minute: string;
  team: string;
  player: string;
  playerZh: string;
  note?: string;
}

export interface Match {
  id: number;
  competition: string;
  season: string;
  matchday: number | null;
  stage: string;
  utcStart: string;
  localDate: string;
  localTime: string;
  localDay: string;
  homeTeam: string;
  awayTeam: string;
  city: string;
  stadium: string;
  status: MatchStatus;
  result: string | null;
  goalEvents?: GoalEvent[];
  isKnockout: boolean;
  isPlaceholder: boolean;
}

export interface SchedulePayload {
  generatedAt: string;
  timezone: "America/Los_Angeles";
  source: string;
  sourceUrl: string;
  matches: Match[];
}

export interface DayBucket {
  date: string;
  label: string;
  matches: Match[];
}

const timezone = "America/Los_Angeles";
const teamNameZh = new Map<string, string>([
  ["Algeria", "阿尔及利亚"],
  ["Argentina", "阿根廷"],
  ["Australia", "澳大利亚"],
  ["Austria", "奥地利"],
  ["Belgium", "比利时"],
  ["Bosnia & Herzegovina", "波黑"],
  ["Brazil", "巴西"],
  ["Canada", "加拿大"],
  ["Cape Verde", "佛得角"],
  ["Colombia", "哥伦比亚"],
  ["Croatia", "克罗地亚"],
  ["Curaçao", "库拉索"],
  ["Czechia", "捷克"],
  ["DR Congo", "刚果民主共和国"],
  ["Ecuador", "厄瓜多尔"],
  ["Egypt", "埃及"],
  ["England", "英格兰"],
  ["France", "法国"],
  ["Germany", "德国"],
  ["Ghana", "加纳"],
  ["Haiti", "海地"],
  ["Iran", "伊朗"],
  ["Iraq", "伊拉克"],
  ["Ivory Coast", "科特迪瓦"],
  ["Japan", "日本"],
  ["Jordan", "约旦"],
  ["Mexico", "墨西哥"],
  ["Morocco", "摩洛哥"],
  ["Netherlands", "荷兰"],
  ["New Zealand", "新西兰"],
  ["Norway", "挪威"],
  ["Panama", "巴拿马"],
  ["Paraguay", "巴拉圭"],
  ["Portugal", "葡萄牙"],
  ["Qatar", "卡塔尔"],
  ["Saudi Arabia", "沙特阿拉伯"],
  ["Scotland", "苏格兰"],
  ["Senegal", "塞内加尔"],
  ["South Africa", "南非"],
  ["South Korea", "韩国"],
  ["Spain", "西班牙"],
  ["Sweden", "瑞典"],
  ["Switzerland", "瑞士"],
  ["Tunisia", "突尼斯"],
  ["Türkiye", "土耳其"],
  ["United States", "美国"],
  ["Uruguay", "乌拉圭"],
  ["Uzbekistan", "乌兹别克斯坦"],
]);

export function formatTeamName(team: string): string {
  if (team.startsWith("TBD Home")) return `待定主队 ${team}`;
  if (team.startsWith("TBD Away")) return `待定客队 ${team}`;
  const chineseName = teamNameZh.get(team);
  return chineseName ? `${chineseName} ${team}` : team;
}

export async function loadSchedule(): Promise<SchedulePayload> {
  const response = await fetch(`/schedule.json?ts=${Date.now()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Unable to load schedule.json: ${response.status}`);
  }
  return (await response.json()) as SchedulePayload;
}

export function getPacificDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function formatPacificDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const localNoon = new Date(Date.UTC(year, month - 1, day, 19, 0, 0));
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(localNoon);
}

export function groupByLocalDate(matches: Match[]): DayBucket[] {
  const buckets = new Map<string, Match[]>();
  for (const match of matches) {
    const bucket = buckets.get(match.localDate) || [];
    bucket.push(match);
    buckets.set(match.localDate, bucket);
  }
  return [...buckets.entries()].map(([date, bucket]) => ({
    date,
    label: formatPacificDate(date),
    matches: bucket.sort(sortByStart),
  }));
}

export function sortByStart(a: Match, b: Match): number {
  return new Date(a.utcStart).getTime() - new Date(b.utcStart).getTime();
}

export function getTodayMatches(matches: Match[], today = getPacificDate()): Match[] {
  return matches.filter((match) => match.localDate === today).sort(sortByStart);
}

export function getFutureMatches(matches: Match[], today = getPacificDate()): Match[] {
  return matches.filter((match) => match.localDate > today).sort(sortByStart);
}

export function getRecentResults(matches: Match[], today = getPacificDate()): Match[] {
  return matches
    .filter((match) => match.localDate <= today && match.status === "Played")
    .sort(sortByStart)
    .slice(-6)
    .reverse();
}

export function getKnockoutMatches(matches: Match[]): Match[] {
  return matches.filter((match) => match.isKnockout).sort(sortByStart);
}

export function getMatchTitle(match: Match): string {
  return `${formatTeamName(match.homeTeam)} vs ${formatTeamName(match.awayTeam)}`;
}
