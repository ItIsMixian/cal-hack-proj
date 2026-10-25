# 变更记录

## 2026-10-25：当前 yq 成果交付检查

- 按用户要求整理当前未提交的日记改动，并准备连同本地已有提交推送至 `origin/yq`。
- 37 项日记测试、3 项 Home 测试、前端构建、后端类型检查与文档构建通过；范围和未覆盖项见 [交付复验](validation/2026-10-24-yq-branch.md#2026-10-25当前实现交付前复验)。

## 2026-10-24：Diary 只显示上次关闭后的内容

- 两个 Diary 入口在合并摘要前只保留上次关闭后生成的记录；关闭时间按身份保存在浏览器，角色房间独立计时，小镇 Diary 覆盖全部角色。
- 打开期间内容保持可见，关闭／刷新时推进时间点；空状态和新增圆点遵循相同边界。首次使用显示已有记录，历史数据保留。
- 37 项日记测试、3 项 Home 测试与构建通过；本次没有浏览器点击复验，时间点不跨设备同步。见 [验证与限制](validation/2026-10-24-diary-comments.md#since-the-previous-close-2026-10-24)。

## 2026-10-24：Diary 只保留简洁聊天摘要

- 按用户要求过滤旧日记中的常见场景动作、手势、AI 决策与环境描写；每次合并交流改为一段最多两句、50 词／280 字符的去重摘录。
- 生成提示只要求聊天主题与一个有效细节；失败时显示缺少摘要，不再用分身活动替代。后端变更尚未发布。
- 30 项日记测试、前端构建、后端类型检查通过；旧文本过滤仍为启发式，本次未做浏览器或真实模型复验。见 [验证与边界](validation/2026-10-24-diary-comments.md#concise-chat-only-summary-2026-10-24)。

## 2026-10-24：建筑人物 tag 打开 Status card

- 增加姓名、当前活动／地点、最近聊天时间，以及用户角色与该人物近期交流的内容要点和可展开原文。按角色 ID 匹配，默认近 7 天最多 5 次；没有记录时显示空状态。
- 构建、7 项测试及真实地图组件的桌面／窄屏模拟数据点击检查通过；未写共享数据库或调用模型。见 [Status card 验证](validation/2026-10-24-resident-status-card.md)。

## 2026-10-24: restore local preview using the user-provided shared address

- Verified the supplied temporary origin, updated only ignored local connection/public-client settings, and confirmed local authored-map rendering, 7 live mirrors, Residents navigation and the hosted login form.
- No email, mirror changes, database publication, source changes or remote push were performed. Initial failure and recovery evidence remain together in [runtime validation](validation/2026-10-24-local-frontend-runtime.md).

## 2026-10-24: check the existing local frontend after merging

- Confirmed the local login screen and images load, then reproduced guest connection failure caused by the configured temporary backend hostname no longer resolving; local account login also lacks a client ID.
- Saved browser evidence and separated historical successful preview results from current connectivity. No application, environment or shared database changes were made. See [runtime validation](validation/2026-10-24-local-frontend-runtime.md).

## 2026-10-24: update local yq from yw/map-assets 7509d4b

- Merged the latest movement/navigation, town HUD, resident-exit controls and compressed/preloaded Home art into yq, retaining the authored Godot project and previous local login/map repair.
- Reconciled the PROGRESS documentation conflict without changing consensus principles or promoting Proposed documents. No database publication, scheduling reducer, resident update or remote push is included.
- Local build, typecheck, test and preservation outcomes are recorded in [update validation](validation/2026-10-24-update-yw-map-assets.md).

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

## Diary records discussed content — 2026-10-24

Changed Diary from selecting a latest appraisal to listing concrete content from all notes
in a merged visit, with normalized repeat removal and an honest missing-topics state. The
local generation prompt now prioritizes transcript-only topics, questions and examples;
it remains unpublished. Build, backend typecheck, 25 tests and desktop/portrait previews
passed. See [validation](validation/2026-10-24-diary-comments.md#conversation-content-instead-of-appraisal-2026-10-24).

## Nearby diary exchanges merged — 2026-10-24

Merged nearby exchanges with the same displayed person, own mirror and venue into one comment,
using a 30-minute total-span default. A venue change starts a separate visit. The comment shows
the latest reflection, timestamp range and exchange count; stored records remain intact.
Build, 23 diary tests and desktop/portrait previews passed. See [validation](validation/2026-10-24-diary-comments.md#nearby-exchanges-in-one-comment-2026-10-24).

## Diary grouped by person — 2026-10-24

Grouped diary comments under each displayed name, keeping every exchange with its own time
and place. Groups sort by their most recent conversation; notes inside each group sort newest
first. Build, 19 diary tests and desktop/portrait previews passed. See [validation](validation/2026-10-24-diary-comments.md#grouping-by-person-2026-10-24).

## Comment-style Diary — 2026-10-24

Replaced book pagination with a newest-first list of names, one-sentence reflections and
time/place metadata. Historical text is reduced by selecting an existing sentence; interest
and mutual-contact controls remain. Updated the local backend prompt for future short
reflections; it is not published. Build, 18 diary tests, backend typecheck and desktop/portrait
preview checks passed. See [validation](validation/2026-10-24-diary-comments.md).

## Larger, raised furniture labels — 2026-10-24

Enlarged all four furniture names and scroll frames together by 30%, shifting their centers
upward by 32 CSS pixels. Build and all four label clicks in desktop/portrait previews passed.
See [validation](validation/authored-mirror-room.md#larger-raised-nameplates-2026-10-24).

## Scroll furniture nameplates — 2026-10-24

Replaced the four Mirror Room furniture-name frames with the user's supplied scroll PNG,
preserving its pixels/transparency and aspect ratio. Labels remain live text; long names
widen the frame. Checked all four label clicks on desktop/portrait, and raised the mirror
label clear of the bottom hint. See [validation](validation/authored-mirror-room.md#scroll-nameplates-2026-10-24).

## Contact editing in the mirror — 2026-10-24

Moved the existing contact form into the mirror's profile panel and removed the independent
Address book hotspot. The contact reducer, length limit and mutual-interest sharing rules
are retained. Build and 16 diary/Home tests passed; isolated desktop/portrait browser checks
verified the actual merged UI and local mocked save/reopen/clear behavior. See [validation](validation/authored-mirror-room.md#contact-editing-merged-into-the-mirror-2026-10-24).

## Simplified Mirror Room controls — 2026-10-24

Removed “About your mirror”, “Just for you” and all bottom shortcut buttons at the user's
request. Updated the remaining hint to describe direct furniture interaction. Build passed;
all five in-scene objects opened and closed their matching preview panels on desktop and
portrait. See [validation](validation/authored-mirror-room.md#simplified-room-controls-2026-10-24).

## Full-screen Mirror Room — 2026-10-24

Made the authored room cover the viewport with its original proportions. Added bounded
drag/keyboard exploration and fixed furniture shortcuts; heading, return and collapsible
owner summary sit over the scene. Build, 3 Home tests and desktop/portrait component preview
checks passed. See [validation and screenshots](validation/authored-mirror-room.md#full-screen-room-2026-10-24).

## Remove standing Mirror Room character — 2026-10-24

Removed the room's standing character/name button and unused styles/props. Build passed;
the actual room component rendered without the character and all five furniture callbacks
worked in an isolated browser preview. See [validation](validation/authored-mirror-room.md#remove-standing-room-character-2026-10-24).

## Larger building resident portraits — 2026-10-24

Enlarged indoor resident portrait frames/art by 50%, including click bounds, row spacing and conversation-indicator offsets. Build passed; checked the eight-resident two-row layout and selecting a portrait from its enlarged edge in the local browser. See [validation](validation/2026-10-24-building-resident-pins.md).

## General wheel zoom — 2026-10-24

Added cursor-anchored wheel zoom in General mode, with a viewport-cover minimum and bounded camera position during dragging, easing and resizing. Production build and 14 scene/camera tests passed; actual desktop and portrait browser wheel/drag checks confirmed no exposed map border. See [validation and screenshots](validation/2026-10-24-general-wheel-zoom.md).

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

## Teammate login/map fixes integrated — 2026-10-24

Integrated yq commit 7c7f5e6: retain literal commas in town asset URLs for Vite static
serving, use literal filesystem paths in the corresponding regression, lower the desktop
email field/guidance and show focus on the existing artwork frame. Teammate device evidence
is retained under validation/2026-10-24-*. Current branch timing/navigation/room delivery
and data-preserving exit behavior remain in place. Email login_hint duplication investigation
is recorded but authentication behavior was not changed by this integration.

## 2026-10-24 — Import-first onboarding and voice calibration

Implemented Ask your AI / own-writing creation with a three-word fallback, reusable redacted
preparation, in-room fact confirmation and optional TIPI refinement. Added dated daily questions,
today-only topics, private style descriptions and five generated examples with protected owner
feedback. AI summaries never train voice. Server checks reject copied source sentences and malformed
style output before replacement; line writing consumes only its own style and current topic.
Published additive local migrations with data preservation. Full suite: 93 tests; desktop/mobile
browser checks and real synthetic imports passed. Owner voice acceptance and timed external-assistant
phone onboarding remain Pending. See `validation/import-onboarding-and-voice.md`.

## 2026-10-24 — Meet and teach the reflection in its room

Replaced form-like onboarding with a continuous-room encounter: the reflection speaks in an anchored
bubble, materials are handed over as letters, and the user responds to the current turn. Name-only
entry can go straight to town. Fact checking, voice rehearsal, daily questions and optional checks
now proceed one item at a time. Local import/privacy contracts remain; concurrent wardrobe work is
retained. Validation: `validation/interactive-first-meeting.md`.

## 2026-10-24 — Adopted selectable characters

Integrated the owner's approved v8 designs as four selectable looks alongside the original. Added shared portrait/room/town atlas rendering, generated side/back reference poses, prepared 32KB runtime atlases and a small foot-step cycle. Character choice is previewed in the room, supports native radio keys/mobile scrolling and locks after saving. Build and nine targeted tests pass; desktop/mobile room, all facing views and synthetic town picking were checked in the browser. Details and remaining checks: `validation/character-wardrobe.md`.

## 2026-10-24 — Act at the desk, rehearse at the mirror

Implemented grounded character walking and camera follow between desk, mirror and door, with larger
room characters. Name-tag and desk-paper inputs replace floor form controls. Actual import status
controls reading and the next journey. Mirror rehearsal now generates contextual replies, allows
explicit private owner-authored corrections and uses them in later attempts. New mirrors remain
away from town until the door; existing room tools use the same journey. No schema reset.
Evidence and remaining voice acceptance: `validation/room-actions-and-rehearsal.md`.

## 2026-10-24 — Full character walk poses

Replaced the provisional foot-only step with new per-direction stride body/limb poses for all four adopted characters. Original animation atlas supplies the motion reference. Approved heads and idle frames remain pixel-identical, with a one-pixel head bob during strides. Room and town now use shared original 5fps cadence. Build, eleven targeted tests and 48-frame pixel verification pass; actual-atlas animation GIF and browser evidence are recorded in `validation/character-wardrobe.md`.

### Character frontend deployment completed

Published `15e9756` to `yw/map-assets`; Actions `40169358901` build/deploy succeeded. Release package passed 82 tests. Hosted HTML/PNG hashes and browser guest/character-preview checks passed. Kept existing production creation/account/backend behavior; local learning/room/transfer/Facebook work remains uncommitted and outside this release. See `validation/character-release.md`.
