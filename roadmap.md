# WorldCup WestTime Roadmap

## 当前状态：活跃开发中

## 项目介绍

WorldCup WestTime 是一个面向 Karl 自用的 2026 美加墨世界杯赛程表。核心体验是打开 app 立刻看到今日美西时间赛程，同时能扫未来赛程、最近赛果，以及淘汰赛 TBD 对阵是否已经更新。

## 已实现功能

- [x] 今日赛程按 America/Los_Angeles 展示
- [x] 未来赛程按美西日期分组
- [x] 最近赛果面板
- [x] 淘汰赛 placeholder / progress 面板
- [x] `scripts/update_schedule.mjs` 每日刷新数据脚本
- [x] `public/schedule.json` 静态快照
- [x] MVP Gate 脚本

## 未实现功能

### P0
- [ ] 部署到 Vercel 并拿到生产 URL
- [ ] 接入 KarlHub 入口
- [ ] 设置每天 08:00 PT 刷新数据与淘汰赛进度的 cron，持续到 2026-07-19

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
- OpenClaw cron for daily update

## 运行方式

```bash
npm install
npm run update:schedule
npm run dev
```

## 完成度

65%
