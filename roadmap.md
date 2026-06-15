# WorldCup WestTime Roadmap

## 当前状态：活跃开发中

## 项目介绍

WorldCup WestTime 是一个面向 Karl 自用的 2026 美加墨世界杯赛程表。核心体验是打开 app 立刻看到今日美西时间赛程，同时能扫未来赛程、最近赛果，以及淘汰赛 TBD 对阵是否已经更新。

## 已实现功能

- [x] 今日赛程按 America/Los_Angeles 展示
- [x] 未来赛程按美西日期分组
- [x] 最近赛果面板
- [x] 淘汰赛 placeholder / progress 面板
- [x] `scripts/update_schedule.mjs` 赛后刷新数据脚本
- [x] `public/schedule.json` 静态快照
- [x] MVP Gate 脚本
- [x] 比赛城市与场馆展示
- [x] 已结束比赛进球球员与进球时间展示

## 未实现功能

### P0
- [x] 部署到 Vercel 并拿到生产 URL
- [x] 接入 KarlHub 入口
- [x] 将每天 08:00 PT 刷新改为每场比赛结束后刷新数据与淘汰赛进度，持续到 2026-07-19

### P1
- [ ] 收藏球队筛选
- [ ] iCal 订阅/一键加入日历
- [ ] 比赛结束后展示完整比分和状态变化提示

### P2
- [ ] 浏览器推送提醒
- [ ] 电视/桌面 always-on 视图
- [ ] 多数据源交叉校验和异常告警

## 技术栈

- Vite + TypeScript
- Static JSON data snapshot
- Vercel static hosting
- OpenClaw cron for match-end update

## 运行方式

```bash
npm install
npm run update:schedule
npm run dev
```

## 完成度

92%

## 当前阻塞

- 无 P0 阻塞；生产 URL 为 https://worldcup-westtime.vercel.app。
- 旧 08:00 PT daily cron `faaabd75-bd4b-474a-b8b1-7791f125a5a5` 需要停用或替换为赛后刷新计划。

## Review notes
- 2026-06-13 Review：`gates/worldcup-westtime-mvp.sh` 与 `gates/feature-refresh-resilience.sh` 复跑通过；08:00 PT daily refresh commit `5a197ba` 已生成并保留 `public/schedule.previous.json`。因 Vercel token 仍阻塞生产 URL，完成度仅从 78% 校准到 80%，不能 Delivered。
- 2026-06-14 Review：commit `e9507c4 feat: show match venues` 后，`gates/feature-match-locations.sh` 复跑通过；08:00 PT refresh commit `af3ebd2` 后，`gates/worldcup-westtime-mvp.sh` 与 `gates/feature-refresh-resilience.sh` 继续通过。核心自用体验已经包含美西时间、未来赛程、最近赛果、淘汰赛进度、城市/场馆与日刷 cron；但生产 URL 仍被 Vercel token 阻塞，P1/P2 未完成，完成度校准到 84%。
- 2026-06-15 Main：Vercel 登录恢复后生产部署成功；已加入 KarlHub；新增中英国家名与已结束比赛进球事件；刷新策略改为每场比赛结束后执行一次 update/gate/deploy。
