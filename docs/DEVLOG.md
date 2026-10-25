# 变更记录

## 2026-10-24：邮箱重复输入调查

- 静态检查和携带虚构邮箱 login_hint 的托管页面检查确认，第二页仍显示空邮箱框；没有发送邮件或修改认证实现。
- 单次输入后直接发信仍为待确定方案，未选定或接入替代服务。见[调查记录](validation/2026-10-24-email-login-investigation.md)。

## 2026-10-24：本地前端连接共享数据库并修复地图预览

- 按用户提供的地址配置被 Git 忽略的 `.env.local`，启动本地前端；访客预览已连接共享小镇并收到 12 个分身。
- 修复地图素材逗号文件名的 URL 编码，补强现有测试以复现静态路径解码问题；修复后地图正常显示、6 项地图测试及构建通过。见[验证记录](validation/2026-10-24-shared-frontend-preview.md)。

## 2026-10-24：修复登录邮箱框聚焦时的双框外观

- 将桌面邮箱 input 的独立焦点轮廓改为既有美术边框高亮；手机沿用原边框显示焦点，保留按钮的键盘焦点提示。
- 本机浏览器验证桌面输入、Tab 切换及 390px 手机布局；构建和 10 项登录测试通过。见[验证记录](validation/2026-10-24-login-focus.md)。
- 后续按用户要求将桌面邮箱框和提示整体下移约 29px（1280 × 720），检查桌面间距与手机布局，并重新构建通过；截图与结果追加在同一验证记录。

## 2026-10-24: merge teammate application code into local yq

- Downloaded origin/yw/map-assets at cd9a191 and merged its application, generated bindings, assets, tests and validation records into yq, starting from 1f404a9.
- Source files merged without conflicts; reconciled PROGRESS and project structure, preserving the previous author text in history and retaining the user's original mirrorvile project.
- Consensus ADRs and personal Proposed ideas remain distinct; importing code does not accept new proposals. This merge does not publish a database or deploy the app.
- Local check outcomes and limitations: [merge validation](validation/2026-10-24-merge-yw-map-assets.md).

## 2026-10-24：上传 Home 场景与素材到 yq

- 按用户要求提交 mirrorvile/Home.tscn、5 张新增图片及对应 import 文件，共 11 个工程文件，约 5.1 MiB。Home 包含 Background、Bookshelf、Mirror、Diary、Carddesk 节点。
- 静态核对工程与场景的 26 处资源引用，均能定位；未运行 Godot 或验证场景互动，缓存继续排除，ADR 与 Proposed 不变。

## 2026-10-24：上传当前小镇地图与素材到 yq

- 按用户要求提交 mirrorvile/Town map.tscn、新增地图图像与 import 元数据，以及房屋阴影素材的位置调整；场景包含 Coffee、Restaurant、Park 等节点和 House / Decoration 两个 TileMapLayer。
- 静态检查工程与场景的 21 处资源引用，均存在对应文件。未运行 Godot，未验证地图运行或互动；缓存继续排除，ADR 与 Proposed 状态不变。

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

- Implemented 0008 on `yw/diary`: conversation diaries, visible interest, mutual contact unlock and
  Mirror Room contact editing; additive local migration preserved model keys. Legacy postcard/chat
  tables retained for migration safety, their API removed. Acceptance and Pending items are in
  `validation/0008-diary-and-mutual-interest.md`.

- Added the team's pixel-art Figma login entry using exported source layers and a locally hosted font;
  integrated SpacetimeAuth account sessions alongside preserved browser guests. An empty Maincloud
  database hosts auth configuration; the simulation remains local. See `validation/login-figma-and-auth.md`.

- Reused the teammate's existing Cup Nooble character sheet for four-direction walking/idle mirrors;
  updated Mirror Room/creation previews, sprite hit areas, depth and bubble spacing. Source attribution
  and license retained; checks and Pending items are in `validation/character-sprites.md`.
# Optional intent — 2026-10-24

Made intent optional in the creation form and create/update reducers, retaining the length limit and existing Park default. Local module updated without deleting data. Checks: `validation/optional-intent.md`.
# Pixel room, town and journal — 2026-10-24

Turned Mirror Room into a clickable pixel interior, then matched the town with furnished venues and a game action dock. Diary now opens as a paginated paper journal in game panels, including a mirror-specific room entrance. Existing import, card, contact and interest handlers retained. Evidence: `validation/pixel-room.md` and `validation/pixel-town-and-diary.md`.

## Intent-free roaming — 2026-10-24

Fixed blank-intent mirrors inheriting a persistent Park preference. They now explore occupied places after lingering, while explicit intents and event attraction retain their behavior. Six selector tests and ten diary tests pass; local update preserved data. Live mixian observed walking toward Café. Evidence: `validation/intent-free-roaming.md`.

## WeChat CSV — 2026-10-24

Added browser-only PyWxDump CSV imports at the writing desk: retain sent plain text, omit received/quoted/forwarded/media records and export metadata, redact then preview, and combine multiple CSVs. Malformed CSVs cannot fall back to raw upload. Actual local exports retained 87 and 4 text messages; ten parser/UI callback tests and production build passed. No personal exports committed or submitted to the model. See `validation/wechat-csv-import.md`.

## Mirror fidelity A/B — 2026-10-24

On `yw/fidelity`, replaced append-only imports with complete per-facet merges, protected owner edits, previous-text undo, explicit AI scenes and dated Recent guards. Added owner summaries, source inference and clear sharing chips. Regenerated the owner's external AI scene files and dated the WeChat export; validated live imports on isolated mirrors 10/11 without changing mixian's cards. Additive local publication preserved data. Validation and Pending human/rebase acceptance: `validation/mirror-fidelity-a-b.md`.

## Authored town and Home scenes — 2026-10-24

On `yw/map-assets`, imported the teammate's complete town (`329e7e8`) and Home (`1f404a9`)
compositions with original PNGs, transforms, tile layers and provenance. Added a full-screen
General/Follow town camera and connected the room furniture to existing panels. A temporary
HTTPS preview supports guest access when venue Wi-Fi blocks direct LAN access. Production
build and 55 regression/scene tests pass; desktop/portrait interactions were checked. No database
publish/reset or mixian edits. Evidence and Pending device checks: `validation/authored-town-and-camera.md`
and `validation/authored-mirror-room.md`.

## Phone login and temporary sharing — 2026-10-24

Fixed phone entry clipping and removed the second input-frame appearance. Original PNGs remain;
phone artwork now totals about 121KB, with inline WOFF2 and gzip production delivery on share URLs.
Retained localhost HMR. Saved exact share-domain auth callbacks after owner confirmation and verified
the hosted email-login page opens. Build and 59 tests pass; actual phone speed and complete email
magic-link return still need owner validation. See `validation/mobile-login-and-share-performance.md`.
