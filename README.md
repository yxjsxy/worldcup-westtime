# WorldCup WestTime

WorldCup WestTime is a small schedule dashboard for the 2026 FIFA World Cup in America/Los_Angeles time. It opens directly to today's fixtures, then shows recent results, knockout placeholders/progress, and upcoming dates.

## What It Solves

World Cup schedules are usually published in venue time, ET, or UTC. Karl mainly needs one fast app that answers: what games are today in Pacific time, what is next, and have knockout placeholders been resolved yet?

## Core Features

- Today-first schedule in America/Los_Angeles time.
- Future schedule grouped by Pacific date.
- Recent results panel.
- Knockout progress panel that starts with TBD placeholders and updates as the data source resolves teams.
- Static `public/schedule.json` data for fast Vercel hosting.
- `scripts/update_schedule.mjs` refresh command for the daily 08:00 cron.

## Data Source

Primary source: matchesio World Cup 2026 JSON export, cross-checked against FIFA's official World Cup 2026 fixtures page for tournament scope and schedule framing.

## Run

```bash
npm install
npm run update:schedule
npm run dev
```

## Build

```bash
npm run build
```

## Gate

```bash
bash gates/worldcup-westtime-mvp.sh
```

## Deploy

Target: Vercel static app, then add to KarlHub as `WorldCup WestTime`.

The daily update flow should run:

```bash
cd ~/Documents/vibe_coding/worldcup-westtime
npm run update:schedule
npm run build
vercel --prod --yes
```
