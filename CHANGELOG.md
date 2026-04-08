# Changelog

本文件记录仓库中对用户可见、对仓库质量有明显影响的更新。

## 2026-04-08

### Added

- 继续吸收广州 shortlist backlog，再新增 4 道正式题，覆盖金额分摊与尾差处理、订单快照设计、语音房/直播间核心模块，以及程序化广告/实时统计链路。
- 继续吸收广州 shortlist 的高信号 backlog，再新增 4 道正式题，覆盖自动化工单系统、时序数据库选型边界、压测方案设计，以及告警到回滚止损的排障闭环。
- 结合 5 篇后端 / AI Agent 面试复盘文章，再新增 5 道正式题，覆盖 goroutine vs 线程、Agent 框架选型、Agent 失败场景治理、ReAct/CoT/ToT 取舍、企业客服 Agent 分层架构与幻觉防控。
- 基于真实面试经历新增 8 道正式题，覆盖 WaitGroup、select 调度、协程池、sync.Map 引用安全、InnoDB/MyISAM 的 `count(*)` 差异、Redis 宕机降级、Redis List 与 MQ 选型、gRPC 底层机制。
- 新增 `模拟面试` 模式，支持 `掌握回顾 / 冲刺提升 / 真实混合` 三种题源与 `5 / 8 / 12` 题量。
- 模拟结果页新增 `薄弱题再练一轮`，可直接基于本轮模糊题、被打回题和未作答题继续练。
- 站点新增 `最近更新` 面板，公开展示最近几轮功能迭代。

### Improved

- 模拟结果页补充薄弱分类统计和下一轮训练建议，让结果页从报告终点变成训练指导页。

## 2026-04-07

### Added

- 新增 5 道基于当前 Go 后端岗位 JD 收敛的高频正式题，覆盖 RESTful 设计、缓存一致性、队列治理、SSE 流式输出和 MongoDB 事务。
- 新增仓库级 `validate-site.mjs` 校验脚本。

### Improved

- 站点补充 canonical、Open Graph、Twitter Card 和社交分享图。
- GitHub Actions 接入站点元数据与 README 统计一致性校验。
