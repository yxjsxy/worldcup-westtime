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
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    hour12: false,
  }).format(new Date())
}`;

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMatch(match: Match, tone: "today" | "future" | "result" = "future"): string {
  const location = [match.city, match.stadium].filter(Boolean).join(" · ") || "Venue TBD";
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
        <p>${escapeHtml(location)}</p>
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
        <span class="count">Daily 08:00 refresh</span>
      </div>
      <div class="knockout-grid">
        ${visible
          .map(
            (match) => `
          <article class="knockout">
            <span>${escapeHtml(match.stage)}</span>
            <strong>${escapeHtml(match.localDate)} ${escapeHtml(match.localTime)} PT</strong>
            <p>${escapeHtml(getMatchTitle(match))}</p>
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
          <p class="eyebrow">America/Los_Angeles schedule</p>
          <h1>打开就看今天世界杯踢什么</h1>
          <p class="subtitle">今日赛程、未来赛程、赛果与淘汰赛占位统一按美西时间展示。</p>
        </section>
        <aside class="next-card">
          <span>Next kickoff</span>
          ${
            nextMatch
              ? `<strong>${escapeHtml(nextMatch.localDate)} ${escapeHtml(nextMatch.localTime)} PT</strong><p>${escapeHtml(
                  getMatchTitle(nextMatch),
                )}</p>`
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

    ${renderToday(todayMatches, today)}
    ${renderResults(recentResults)}
    ${renderKnockout(knockoutMatches)}
    ${renderFuture(futureMatches, today)}

    <footer>
      <span>Source: <a href="${escapeHtml(payload.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(
        payload.source,
      )}</a></span>
      <span>Updated ${escapeHtml(new Date(payload.generatedAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))} PT</span>
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
