# 2026-10-24 文档合并与差异处理

来源：合并前根目录 docs、cal-hack-proj/docs，源仓库 HEAD `8c6b381e08ee0b0b050b90d63a99113aac67053e`（main，提交说明 Add implementation plan for 0008）。用户请求将两处 docs 合并；本次以根目录 docs 为合并结果，不修改子仓库原稿。

## 合并方式与保存

- 根目录原有 12 篇同名作者文档原文完整保存在 [基线原稿](history/2026-10-24-calhack-baseline.md)，每篇附合并前 SHA-256。
- 子仓库独有的 ADR、设计、计划及验证文件导入；入口类同名文件人工合并，来源与语义差异见下表。
- 仓库原则和状态原文分别保存在 [原则原文](../core/repository-principles.md) 与 [结构原文](../state/repository-structure-0d59463.md)，以免把旧 wave 流程混成最新决定。
- 子仓库原始文件保持不变，包含本来未跟踪的产品流程、服务器方案与安装验证文档。本次没有 fetch、提交、推送、代码修改或服务操作。
- `_site/orrery-docs.html` 不从子仓库复制，以合并后的作者文档重新构建。

## 主要差异

| 问题 | 根目录原记录 | 子仓库记录 | 本次处理 |
| --- | --- | --- | --- |
| 实现与 Git | 未发现代码，当前目录无 Git | React / SpacetimeDB，main 上已有代码 | 明确代码在 cal-hack-proj，父目录仍无 Git；仅静态核对，不声称本机运行 |
| 技术和部署 | 候选栈未选 | 0001 已选 SpacetimeDB；0007 选 Maincloud 但未部署 | 导入既有 Accepted 状态；原对话候选材料仍为 Proposed |
| 需求入口 | 邮箱注册、Library、Settings、Share | 匿名身份、TIPI、Town、Postcards、Mirror Room | 保留两套来源；未见撤回原要求的决定，不把原型视作完整交付 |
| 后续社交闭环 | 回顾故事与真人联系 | 0003 postcard / wave / 私聊；0008 日记 / 可见兴趣 / 联系方式 | 0008 部分取代 0003 但未实现；当前代码仍是旧流程 |
| 默认可见性 | 原需求未定；早期设计称新卡隐藏 | 0005 与 redact.ts 按 facet、personal、room 决定 | 给早期设计加提示，不改写其原文或承诺所有卡隐藏 |
| 房间 | 公共常驻 + 私人小镇为建议 | venue 已有，teammates / friends 仅可见性设置 | 不把后者标成完整房间，也不把原建议升级为批准 |
| 原则与排期 | 本对话未确认演示范围与日期 | 原则写 agreed，记录两人和 10-25 09:00 PT 目标 | 明确“仓库来源”，不冒充当前用户新确认；保留原文 |
| 验证 | Orrery 安装时检查 | 0d59463 上的应用 E2E | 历史记录保持原版本；本次仅检查文档，不继承成 HEAD 运行通过 |

## 阅读与后续更新

从 [PROGRESS](../PROGRESS.md) 和 [原则](../core/discussion-context.md) 开始。ADR 的 Accepted 是源仓库既有记录，重要产品差异仍需协作者实际讨论，文档合并不构成需求变更批准。源原则要求双方共同修改；本次未修改源原则，没有新建 ADR。

根目录 AGENTS 和子仓库 AGENTS 保持原稿；父目录提供原始用户需求边界，子仓库保留其开发与 SpacetimeDB 规则。两份文档后续不会自动同步；如后续希望把合并结果纳入代码仓库，应作为单独明确的迁移或提交操作。
