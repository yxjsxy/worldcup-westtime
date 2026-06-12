export type MatchStatus = "Played" | "To be played" | string;

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
  return `${match.homeTeam} vs ${match.awayTeam}`;
}
