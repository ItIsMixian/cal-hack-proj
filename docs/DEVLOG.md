# 变更记录

## 2026-10-24：上传 mirrorvile Godot 工程快照到 yq

- 按用户要求纳入 mirrorvile/：Godot 工程配置、Player1 / Player2 场景及现有美术、音频素材，共 260 个非缓存文件，约 18.37 MiB。
- 沿用工程自带 .gitignore 排除 .godot/ 缓存；静态核对场景及工程配置中的资源引用均存在。
- 本次为工程快照上传，未运行 Godot，未验证角色动画或场景运行，也不代表现有 React / SpacetimeDB 主程序已迁移到 Godot；共识 ADR 与 Proposed 不变。

## 2026-10-24：个人分支 yq 文档交付

- 按用户要求区分 ADR（已形成共识的确定决定）与 Proposed（最近在考虑的想法）。
- 将此前位于父目录的合并文档与 7 篇 Proposed 纳入 cal-hack-proj 的 yq 分支，修正仓库内相对链接并保留原始参考材料。
- 共识 ADR 0001–0008 和仓库 core/principles.md 保留原文；父目录讨论背景另存为 discussion-context.md，不覆盖团队原则。
- 构建、检查与推送范围见 [交付记录](validation/2026-10-24-yq-branch.md)。

## 2026-10-24：将此前讨论与 main 的差异整理为 Proposed

- 按用户要求建立 7 篇未编号提案：账号登录注册、多种 Onboarding、Library 回顾与行动指导、统一 Settings、社交媒体 Share、常驻公共／私人小镇、备选拆分后端。
- 明确每篇的来源、与本地 main `8c6b381` 的差异、已有重叠、理由、替代方案及待确认事项；保留用户需求与助手建议的区别。
- 不重复提案 main 已接受的 0008 日记，也不把 main 已有私人房间设想称为全新想法；记录多小镇与本周末约束、备选后端与 0001 / 0007 的冲突。
- 更新 Proposed、PROGRESS、交接和 backlog 导航；检查与构建结果见 [验证记录](validation/2026-10-24-discussion-proposals.md)。未修改源码、Accepted ADR、源原则或 Git 分支。

## 2026-10-24：合并 Calhack 与 cal-hack-proj 文档

- 将子仓库作者文档合入根目录 docs，保留 ADR 0001–0008、产品设计、0008 活动计划及历史验证，未复制旧生成页。
- 合并同名入口、原则、状态、待办及参考；纠正“当前无代码／无 Git／无 ADR”的过时结论，并区分当前用户需求、仓库既有决定、实现和测试证据。
- 为 0003 / 0008 的演进、设计中默认可见性等差异增加来源提示，没有新增产品批准。
- 完整保存合并前根目录 12 篇作者文档；子仓库及根目录原始 PRD、赞助商文件不变。
- 重建离线阅读页，检查结果见 [合并验证](validation/2026-10-24-docs-merge.md)。本次未运行或部署产品。

# 变更记录

## 2026-10-24：安装 Orrery 本地文档技能并建立项目文档基线

- 来源为用户提供的 `orrery-docs-local-20261024.zip`，安装至项目 `.agents/skills/orrery-docs-local/`，包含 SKILL、README、LICENSE 和标准库 Python 脚本。
- 使用原包脚本预览并初始化缺失的文档目录，建立 AGENTS 入口。
- 整理 MirrorVille 用户明确需求、现有 FigJam 流程与尚未接受的服务器／房间建议；原 Activity Helper PRD 与赞助商资料保留。
- 生成离线 Markdown 源码阅读页；具体检查与未覆盖项见 [验证记录](validation/2026-10-24-orrery-setup.md)。
- 本次不包含应用开发、真实服务接入或自动后台维护。

## 导入的仓库交付记录

以下为 cal-hack-proj 原有记录，不是本次执行的工作。

# Devlog

Complete deliveries and important changes only.

## 2026-10-24

- Rewrote the project from scratch on SpacetimeDB (0001): town, mirrors, conversations, encounters,
  private chat, TIPI self-card.
- Mirror Room v1: WhatsApp/paste import with in-browser redaction, facet cards, rewrite/undo.
- Lifelike town and postcards (0003, 0004, 0005): daily rhythm, activities, extraversion, relationships,
  grounded conversations, evidence-checked postcards with waves; Mirror Room as a page with per-room defaults.
- Adopted the simplified Orrery documentation system (`docs/`, `.agents/skills/orrery-docs-local/`).
