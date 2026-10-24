# MirrorVille 服务器与小镇组织方式

状态：Proposed，用户尚未明确接受。日期：2026-10-24。

来源：本次用户询问云端交互、一个共享区域、公共陌生人房间与私人邀请房间后的助手建议。以下不是已实现架构。

## 待决定的问题

服务器部署与社交空间分别设计：一套后端可以承载多个逻辑小镇／房间，不必让所有用户出现在同一个区域。

| 选项 | 预期价值 | 主要取舍 |
| --- | --- | --- |
| 单一共享世界 | 开放、偶遇、统一世界感 | 需要处理互动密度、状态规模和事件筛选 |
| 每次随机公共房间 | 接触新用户 | 关系与重复相遇的延续较弱 |
| 常驻公共小镇 | 稳定邻居与逐步熟悉，同时认识新人 | 需要处理冷启动、人数和成员流动 |
| 邀请制私人小镇 | 维系已有朋友的共同经历 | 新关系来源有限，需要明确邀请权限 |

助手建议先考虑“常驻公共小镇 + 邀请制私人小镇”，但用户尚未选择。一个分身同一时间只在一个小镇活动也是原型简化建议，未被确认为规则。

## 后端候选结构

- API 与实时连接：处理用户操作、读取记录、同步已提交的小镇变化。
- 数据库：保存成员、分身状态、事件、指令与授权记录。
- 调度器与任务队列：玩家离线后仍可推进模拟；控制任务并发、重试与预算。
- AI Worker：生成行动建议，由服务器验证后提交状态和事件。
- 第三方模型及社交平台：仅通过实际支持、实际授权的能力接入。

先前讨论中的 Node.js、PostgreSQL、Redis／BullMQ、Supabase Auth、Colyseus 均为候选，没有技术选型决定。

## 建议的验证闭环

两个真实用户创建分身 → 云端产生一次共享相遇 → 双方 Library 看到同一事件 → 用户提交方向 → 后续分身行动受到影响。

这是建议的最小演示，不是用户已批准的范围或已通过的验证。

## 讨论所用参考

- [Colyseus 状态同步](https://docs.colyseus.io/state)
- [Colyseus 房间](https://docs.colyseus.io/room)
- [Colyseus 扩展方式](https://docs.colyseus.io/scalability)
- [BullMQ 幂等任务](https://docs.bullmq.io/patterns/idempotent-jobs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [PostgreSQL 行级权限](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

这些链接曾用于本次对话中的方案解释；安装文档技能时没有重新核验版本、费用、部署限制或账号权限。

## 2026-10-24 合并补充

以上为原对话 Proposed 方案，原文保留。导入的源仓库另有既有 Accepted 决定：[0001](../decisions/0001-spacetimedb-rewrite.md) 选择 SpacetimeDB 并已有代码，[0007](../decisions/0007-public-deployment.md) 选择 Maincloud + 静态前端但尚未实现。它们不等于原对话用户已接受公共／私人小镇或 Node.js / PostgreSQL / Redis 候选结构；当前只有 venue 真正运行。
