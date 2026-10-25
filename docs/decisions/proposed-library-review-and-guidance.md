# Library：按上次访问回顾经历，并指导后续行动

Status: Proposed (2026-10-24). Partly overlaps existing code and Accepted 0008; the full experience is not implemented.

来源：[原需求记录](../design/mirrorville-product-workflow.md)。回顾活动、相遇与事件，以及添加内容指导分身是用户要求；“指令保存后影响后续行为，再形成新记录”是助手补充的闭环描述。

对照基线：本地 main `8c6b381e08ee0b0b050b90d63a99113aac67053e`；本次未 fetch。

## 与 main 的差异

- [0008](0008-diary-and-mutual-interest.md) 已接受每次对话写日记、按天分组、兴趣与联系方式解锁，但尚未实现；日记本身不重新提案。
- 当前 [App](../../src/App.tsx) 有 Town / Postcards，地图可查看对话；[后端](../../spacetimedb/src/index.ts) 已有 updateIntent reducer，可修改 intent 和目标位置。
- 未见覆盖“自上次访问后的行动／相遇／事件 + 用户输入指导后续活动”的完整 Library 界面与验证。后端已有 updateIntent 不等于完整体验已交付。

## 提案

- 提供 Library 作为分身经历的统一回顾入口，能定位自上次访问之后发生的活动、相遇和事件，而不限于成功匹配的记录。
- 复用 0008 的对话日记；活动和其他事件是否纳入同一时间线，作为该方案的增量范围讨论。
- 用户可添加内容指导分身接下来的动作。先比较复用现有 intent 编辑与增加独立指令记录两种方式，不预定新的指令系统。
- “保存指导 → 后续行为受到影响 → Library 可回看结果”作为助手提出、待接受的验证闭环。

## 理由与替代方案

让用户既能了解离线期间的经历，也能对之后的行动提供方向。替代方案为只做 0008 的 Diary，或在 Diary 中补入口而不新增 Library 标签；命名与页面组织尚未决定。

## 影响与待确认

- “上次访问”按登录、打开页面还是上次阅读计算，尚未决定。
- 指导的生效时间、持续时间、是否可撤回以及与既有 intent 的关系，尚未决定。
- 不能把用户指导解释为允许分身替真人承诺或安排见面；[0004](0004-evidence-and-conduct.md) 行为约束仍适用。
- 本提案不替代 0008 的兴趣和联系方式设计，也没有新增运行验证。
