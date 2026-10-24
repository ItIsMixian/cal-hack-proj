# 独立 API、数据库、队列与 AI Worker 的备选后端

Status: Proposed (2026-10-24). Discussion alternative only; no migration accepted or implemented.

来源：[服务器讨论](../library/mirrorville-server-options.md)。这是助手解释云端交互时列出的候选结构与技术名，不是用户已选择的技术栈。按本次用户要求，将与 main 不同的既有讨论单独保存为待评估提案。

对照基线：本地 main `8c6b381e08ee0b0b050b90d63a99113aac67053e`；本次未 fetch。

## 与 main 的差异与冲突

[0001](0001-spacetimedb-rewrite.md) 已接受 SpacetimeDB 作为统一后端，世界状态、reducers、调度和模型 HTTP 调用在一个 module 中；[0007](0007-public-deployment.md) 已接受优先尝试 Maincloud + 静态前端。拆分后端是与既有决定不同的架构候选，不能作为当前既定实施方案。

## 待评估方案

保留之前讨论的职责拆分，作为将来需要比较时的替代方案：

- API／实时连接处理用户操作、读取记录和同步小镇变化。
- 数据库保存成员、分身状态、事件、用户指导和授权记录。
- 调度器／任务队列控制离线推进、并发、重试与预算；AI Worker 生成行动建议，服务器验证后提交。
- 讨论中提到 Node.js、PostgreSQL、Redis／BullMQ、Supabase Auth、Colyseus；这些名字均为候选，不表示必须组合采用。

## 理由与替代方案

原讨论用于说明多人云端交互与离线模拟的职责。是否值得拆分需要实际需求与维护成本比较；现有资料不足以证明迁移必要或优于 main。替代方案就是继续采用已接受的 SpacetimeDB 架构。

## 影响与待确认

- 若选择拆分，将需要重新评估 0001、0007、订阅与身份关联，并明确迁移和验证范围；本次不 supersede 它们。
- 没有新的性能、成本或平台能力调查，也不将旧参考链接视作已验证的最新结论。
- 云端持久化和分身离线活动本身与 main 方向一致；它们不被单独重提为“新差异”。
