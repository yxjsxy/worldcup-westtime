import "./styles.css";
import {
  type Match,
  type SchedulePayload,
  formatPacificDate,
  getFutureMatches,
  getKnockoutMatches,
  getMatchTitle,
  getPacificDate,
  getRecentResults,
  getTodayMatches,
  groupByLocalDate,
  loadSchedule,
} from "./schedule";

const app = document.querySelector<HTMLDivElement>("#app");
const deployLabel = `Deployed in ${
  import.meta.env.VITE_DEPLOYED_AT ||
  "pending Vercel deploy"
}`;

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMatchLocation(match: Match): string {
  return [match.city, match.stadium].filter(Boolean).join(" · ") || "Venue TBD";
}

function getGoalSide(match: Match, goalTeam: string): "home" | "away" | "neutral" {
  if (goalTeam === match.homeTeam) return "home";
  if (goalTeam === match.awayTeam) return "away";
  return "neutral";
}

function renderGoalEvents(match: Match): string {
  if (match.status !== "Played") return "";
  const goals = match.goalEvents || [];
  if (goals.length === 0) {
    return `<div class="goal-events muted">进球详情待同步</div>`;
  }

  return `
    <div class="goal-events">
      ${goals
        .map((goal) => {
          const side = getGoalSide(match, goal.team);
          const sideLabel = side === "home" ? "左队" : side === "away" ? "右队" : "进球";
          return `
        <span class="goal ${side}">
          <b class="goal-side ${side}">${sideLabel}</b>
          <strong>${escapeHtml(goal.minute)}</strong>
          ${escapeHtml(goal.playerZh)}
          ${goal.note ? `<em>${escapeHtml(goal.note)}</em>` : ""}
        </span>
      `;
        })
        .join("")}
    </div>
  `;
}

function renderMatch(match: Match, tone: "today" | "future" | "result" = "future"): string {
  const statusLabel = match.result ? match.result : match.status;
  const statusClass = match.status === "Played" ? "played" : match.isPlaceholder ? "placeholder" : "scheduled";
  return `
    <article class="match ${tone}">
      <div class="time">
        <span>${escapeHtml(match.localTime)}</span>
        <small>PT</small>
      </div>
      <div class="match-main">
        <div class="match-meta">
          <span>${escapeHtml(match.stage)}</span>
          <span>${escapeHtml(match.localDay)}</span>
        </div>
        <h3>${escapeHtml(getMatchTitle(match))}</h3>
        <p><span>City / venue</span>${escapeHtml(getMatchLocation(match))}</p>
        ${renderGoalEvents(match)}
      </div>
      <div class="status ${statusClass}">${escapeHtml(statusLabel)}</div>
    </article>
  `;
}

function renderToday(matches: Match[], today: string): string {
  if (matches.length === 0) {
    return `
      <section class="panel today-panel">
        <div class="section-title">
          <p>今日赛程</p>
          <h2>${escapeHtml(formatPacificDate(today))}</h2>
        </div>
        <div class="empty">今天美西时间没有比赛。</div>
      </section>
    `;
  }

  return `
    <section class="panel today-panel">
      <div class="section-title">
        <p>今日赛程</p>
        <h2>${escapeHtml(formatPacificDate(today))}</h2>
      </div>
      <div class="today-list">
        ${matches.map((match) => renderMatch(match, "today")).join("")}
      </div>
    </section>
  `;
}

function renderFuture(matches: Match[], today: string): string {
  const buckets = groupByLocalDate(matches).slice(0, 14);
  return `
    <section class="panel">
      <div class="section-title row">
        <div>
          <p>未来赛程</p>
          <h2>${escapeHtml(formatPacificDate(today))} 之后</h2>
        </div>
        <span class="count">${matches.length} matches left</span>
      </div>
      <div class="future-days">
        ${buckets
          .map(
            (bucket) => `
          <section class="day">
            <div class="day-head">
              <h3>${escapeHtml(bucket.label)}</h3>
              <span>${bucket.matches.length} 场</span>
            </div>
            <div class="compact-list">
              ${bucket.matches.map((match) => renderMatch(match, "future")).join("")}
            </div>
          </section>
        `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderKnockout(matches: Match[]): string {
  const resolved = matches.filter((match) => !match.isPlaceholder).length;
  const visible = matches.slice(0, 12);
  return `
    <section class="panel">
      <div class="section-title row">
        <div>
          <p>淘汰赛进度</p>
          <h2>${resolved}/${matches.length} 对阵已确定</h2>
        </div>
        <span class="count">赛后自动刷新</span>
      </div>
      <div class="knockout-grid">
        ${visible
          .map(
            (match) => `
          <article class="knockout">
            <span>${escapeHtml(match.stage)}</span>
            <strong>${escapeHtml(match.localDate)} ${escapeHtml(match.localTime)} PT</strong>
            <p>${escapeHtml(getMatchTitle(match))}</p>
            <small class="knockout-location">City / venue · ${escapeHtml(getMatchLocation(match))}</small>
          </article>
        `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderResults(matches: Match[]): string {
  if (matches.length === 0) return "";
  return `
    <section class="panel">
      <div class="section-title">
        <p>最近赛果</p>
        <h2>已结束比赛</h2>
      </div>
      <div class="compact-list results">
        ${matches.map((match) => renderMatch(match, "result")).join("")}
      </div>
    </section>
  `;
}

function renderFreshness(payload: SchedulePayload): string {
  const generatedAt = new Date(payload.generatedAt);
  const ageHours = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);
  const updated = generatedAt.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });

  if (Number.isNaN(ageHours)) {
    return `
      <section class="freshness warning">
        <strong>Schedule freshness</strong>
        <span>数据更新时间无法解析，请检查 schedule.json。</span>
      </section>
    `;
  }

  if (ageHours > 30) {
    return `
      <section class="freshness warning">
        <strong>Schedule freshness</strong>
        <span>数据可能已过期，上次更新 ${escapeHtml(updated)} PT。请检查赛后自动刷新。</span>
      </section>
    `;
  }

  return `
    <section class="freshness">
      <strong>Schedule freshness</strong>
      <span>Updated ${escapeHtml(updated)} PT</span>
    </section>
  `;
}

function render(payload: SchedulePayload): void {
  if (!app) return;
  const today = getPacificDate();
  const todayMatches = getTodayMatches(payload.matches, today);
  const futureMatches = getFutureMatches(payload.matches, today);
  const recentResults = getRecentResults(payload.matches, today);
  const knockoutMatches = getKnockoutMatches(payload.matches);
  const nextMatch = futureMatches[0] || todayMatches.find((match) => match.status !== "Played") || null;

  app.innerHTML = `
    <header class="hero">
      <nav>
        <strong>WorldCup WestTime</strong>
        <span>FIFA 2026 · 美西时间</span>
      </nav>
      <div class="hero-grid">
        <section>
          <p class="eyebrow">World Cup pulse · America/Los_Angeles</p>
          <h1>世界杯消息同步</h1>
          <p class="subtitle">今日赛程、赛果、进球时间与淘汰赛进度按美西时间同步，打开就是比赛现场感。</p>
        </section>
        <aside class="next-card">
          <span>Next kickoff</span>
          ${
            nextMatch
              ? `<strong>${escapeHtml(nextMatch.localDate)} ${escapeHtml(nextMatch.localTime)} PT</strong><p>${escapeHtml(
                  getMatchTitle(nextMatch),
                )}</p><small class="next-location">City / venue · ${escapeHtml(getMatchLocation(nextMatch))}</small>`
              : "<strong>All matches complete</strong><p>World Cup 2026 has wrapped.</p>"
          }
        </aside>
      </div>
    </header>

    <section class="stats">
      <div><strong>${payload.matches.length}</strong><span>Total matches</span></div>
      <div><strong>${todayMatches.length}</strong><span>Today</span></div>
      <div><strong>${futureMatches.length}</strong><span>Upcoming</span></div>
      <div><strong>${knockoutMatches.length}</strong><span>Knockout</span></div>
    </section>

    ${renderFreshness(payload)}
    ${renderToday(todayMatches, today)}
    ${renderResults(recentResults)}
    ${renderKnockout(knockoutMatches)}
    ${renderFuture(futureMatches, today)}

    <footer>
      <span>Source: <a href="${escapeHtml(payload.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(
        payload.source,
      )}</a></span>
      <span>${escapeHtml(deployLabel)}</span>
    </footer>
  `;
}

function renderError(error: unknown): void {
  if (!app) return;
  app.innerHTML = `
    <section class="error">
      <h1>Schedule failed to load</h1>
      <p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
    </section>
  `;
}

loadSchedule().then(render).catch(renderError);
