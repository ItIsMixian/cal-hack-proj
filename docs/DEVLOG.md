
# 变更记录

## 2026-10-25：整理当前工作交付到 yq

- 用户明确要求将目前工作 push 到个人分支；当前分支及 upstream 均为 yq，fetch 后与 origin/yq 的基线 d85c3ed 一致。
- 交付当前多世界测试后端、独立分身、房间初始入口、限定来源的出发动画、小镇控制器／设置／邀请／公共检索，以及相关素材、测试、文档和截图。忽略的本机数据、密钥、环境配置及生成阅读页不进入提交。
- 构建、后端 TypeScript 检查、69 项相关回归通过；修正一条仍预期满员小镇可发现的旧断言，并覆盖扩容后重新出现及已加入用户继续排除。[范围与验证](validation/2026-10-25-yq-worlds-delivery.md)。

## 2026-10-25：创建加入页增加公共小镇检索

- 按用户截图要求，在 EmptyWorld 增加 Find a public town／Explore public towns；与邀请加入、创建小镇并列，复用现有未加入／开放／未满的小镇列表。
- PublicTowns 增加名称／简介即时检索与无匹配提示。返回保留邀请草稿及来源位置，从地图进入不播放车动画。
- 构建、真实浏览器地图／旅程入口、名称大小写筛选、无匹配、返回保留输入通过。1280×720 三栏完整可见，窗口无内部溢出；未加入／创建小镇。[验证](validation/2026-10-25-empty-world-public-search.md)。

## 2026-10-25：初次进入直接出现于 Mirror Room

- 按用户要求将 App 初始页面改为房间。已拥有分身时使用当前世界内自己的分身；没有分身也显示房间及创建入口，创建与取消均留在房间。
- 等待身份／订阅就绪时禁用创建与出发，避免把加载误当成无分身；邀请入口延迟到实际从房间出发后处理。Go to town 启动既有车动画，地图控制器仍直接切换。
- 构建、8 项房间／动画回归，以及真实浏览器初次进入、刷新、创建打开取消、房间出发到地图均通过。未提交创建或新增测试分身。[验证](validation/2026-10-25-room-first-entry.md)。

## 2026-10-25：开车动画只用于从 Mirror Room 出发

- 用户明确限定触发来源。Mirror Room 的 Back to town 启动动画；Town Map 左右按钮直接切换相邻位置，已有小镇调用 enterWorld，空位显示创建／加入窗口。
- 初次进入与地图菜单的小镇选择为无动画页面，不加载车场景。所有实际准入仍使用原后端检查；构建、5 项 renderer 回归和浏览器双向切换／菜单检查通过。[验证](validation/2026-10-25-room-only-departure.md)。

## 2026-10-25：公共小镇发现列表

- 按用户要求，Explore the public town 进入另一层列表，列出未加入、允许陌生人且人数未满的小镇；展示名称、简介、人数及加入按钮。默认大厅与其他已加入小镇一起按名称显示在主列表。
- 接入 discoverable_worlds 视图并补充人数过滤；复用 joinOpenWorld、独立分身及后端确认后离站。只升级本机测试库，保留原数据与共享库。
- 构建、5 项动画回归、多身份实时发现／隐私字段／权限变更／并发最后名额／自动分身／重复加入验证通过；浏览器检查公共列表和返回。[证据及未覆盖项](validation/2026-10-25-public-town-discovery.md)。

## 2026-10-25：创建加入窗口居中加宽

- 将空世界创建／加入窗口改为视口居中、最大 960px，宽屏双栏、小屏单栏；压缩留白和设置行间距，移除该状态无关的动画工具栏。
- 构建、当前窗口／桌面／手机实际几何与无溢出检查通过；手机创建表单及取消正常。[验证及截图](validation/2026-10-25-centered-town-entry.md)。

## 2026-10-25：恢复英文界面文案

- 用户明确应用为英文。将本轮新增的小镇选择标题、公共入口、创建加入、返回和容量提示统一改为英文，保留用户自定义小镇名称。构建与新增旅程 UI 源文件的中文扫描通过；无行为变更。

## 2026-10-25：精简上车后的小镇选择

- 按用户要求只显示浏览公共小镇、创建／加入新的小镇和已有小镇名称；隐藏未创建位置，公共大厅不重复列名。
- 创建／加入自动使用空位，满位置显示提示；继续复用已有进入与后端确认。构建、实际列表、新建加入入口及公共大厅进入检查通过。[验证](validation/2026-10-25-town-destinations.md)。

## 2026-10-25：离家上车接入真实世界选择

- 用户要求只接入 1ec3221 的离家上车，其他分支内容忽略。原样引入动画预览与说明 10 文件，移植 renderer 并新增 React 容器。
- 登录进入 App、地图左右按钮与 Travel 菜单使用真实世界选择；复用邀请／创建和服务器准入，确认后才离站，失败停留，重复邀请复用原位置。原世界分身继续独立运行。
- 93 项相关测试、构建、桌面／手机实际界面、真实进入、错误邀请及重复邀请检查通过。未更改后端或公开发布。[验证](validation/2026-10-25-departure-integration.md)。

## 2026-10-25：区分游客登录与世界房主角色

- 用户发现房主菜单显示 Guest。原字段仅表示游客登录；现改为 Guest session，并单独根据服务器记录显示 World owner／World member，保留实际权限控制。
- 构建和房主／成员双 origin 菜单检查通过。当前 Local Test World 的 127.0.0.1 游客是房主、localhost 游客是成员；两个地址的匿名身份互相独立。[验证与截图](validation/2026-10-25-world-role-label.md)。

## 2026-10-25：进入世界时从原型自动生成分身

- 用户明确要求已有 AI 分身原型的用户进入新世界自动获得独立分身。新增身份级私有基础设定快照；首次创建保存、已有用户惰性补建。
- 新建世界／邀请加入／开放加入／切换世界统一确保目标世界自己的分身；重复进入不重复创建，已有分身及其经历保持独立。无原型仍走首次创建流程；权限和容量继续校验。
- 本机测试库新增 mirror_prototype，未删除数据；真实联调、回归及限制见 [验证](validation/2026-10-25-auto-world-mirrors.md)。

## 2026-10-25：各世界独立分身与持续模拟

- 用户要求不同世界的分身独立，切换后原世界仍持续运行。移除 enterWorld 的居民迁移、对话终止与休息清理；每个世界单独创建分身，私有视图及修改权限按当前世界校验。
- 分身数量、对话并发、每日 good-fit 和导入互斥改为世界额度；新增私有 world_simulation 时钟，所有世界持续 tick，世界之间使用独立确定性随机流。
- 本机库以 --delete-data=never 升级，保留已有记录。构建、后端类型检查、85 项相关单元检查与真实多身份往返隔离检查通过。完整运行观察与边界见 [验证](validation/2026-10-25-independent-world-mirrors.md)。原共享库未发布，真实模型行为未验证。

## 2026-10-25：独立本机多世界后端部署

- 用户明确选择本机独立测试环境。启动官方 SpacetimeDB 2.13.0，监听回环地址 3010，发布 mirrorville-worlds-test 并把 5173 前端接入。
- 新增真实世界、身份成员、房主鉴权、邀请加入／替换、陌生人开关、事务人数限制和当前世界；角色、对话、台词为私有底表加成员视图，日记／关系记忆按世界分开。
- 前端创建、编辑、复制邀请、加入和切换已接通，去掉测试模式的伪房主开关。新增可重复启动脚本和多身份 SDK 集成检查；原共享数据库与本地旧环境配置保持不动。
- 78 项相关单元检查、真实 SDK 权限／隔离／并发名额检查、双身份浏览器邀请加入和服务重启保留通过。既有 Status card 测试仍失败，真实模型／邮箱登录未验证；详见 [交付记录](validation/2026-10-25-local-world-backend.md)。

## 2026-10-25：空世界加入／创建窗口

- 按用户要求，在不存在世界的深灰界面加入居中窗口，包含邀请链接输入与创建新世界；桌面并排、手机上下排列。
- 创建入口复用世界设置表单，保存为当前空位的本机世界预览，更新名称／圆点并在刷新后恢复。新预览不显示真实小镇居民，且不开放其日记或创建分身入口；个人 Mirror Room 保持可达。
- 邀请入口检查 HTTP(S) 链接格式并注明实际加入尚未开放，不访问输入链接，不把格式通过记为成功加入。
- 构建、链接格式、创建／取消／编辑／刷新和竖屏布局检查通过；验证详情与未覆盖项见 [记录](validation/2026-10-25-empty-world-entry.md)。

## 2026-10-25：房主 Edit world 前端预览

- 用户要求房主在 Menu 中编辑小镇加入规则和人数，随后明确先做前端预览。
- 新增房主／访客视角切换；仅现有世界的房主视角显示 Edit world。面板支持名称、简介、陌生人开关、最多人数，以及保存／取消。
- 预览值按世界 ID 保存在本机浏览器，名称同步顶部指向器；不代表真实房主鉴权或后台人数／入场控制。默认 20 人、范围 1–100 为当前预览取值。
- 实际浏览器检查通过：保存与刷新保留、访客／空世界隐藏入口、取消／Escape 不保存、人数上下界、桌面与竖屏布局；见 [验证](validation/2026-10-25-world-settings.md)。

## 2026-10-25：Town Map 世界指向器

- 使用用户提供的原始透明素材显示世界名称，加入 5 个状态点和左右循环切换按钮。
- 当前 Mirrorville 为唯一已存在位置，另外 4 个为空位；空位显示深灰纯色、隐藏地图人物，并禁用小镇数据入口。适配桌面和手机宽度。
- 用户随后明确 Mirror Room 应一直可点击：有本人分身时，该入口在全部世界均启用，打开同一个个人房间；返回保留原世界位置。移除世界／连接状态对该入口的禁用条件。
- 前端构建、桌面／竖屏实际点击、键盘切换、循环边界与颜色检查通过；本次只实现前端导航。见 [验证记录](validation/2026-10-25-world-navigation.md)。

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

## 2026-10-24 — Selectable characters and frame animation

Owner-authorized frontend publication adds four adopted looks beside the original, visual selection in the current online creation form, consistent room/roster portraits and town rendering, and original-cadence full-body walk poses. No backend or account-flow changes. Production build and 82 tests pass. See `validation/character-release.md`.

## Existing-mirror appearance editor

Added owner-only persistent appearance changes from Mirror Room, with preview/cancel/save and error retry. Production package passes 88 tests and live Maincloud save/reconnect/other-owner denial checks. No table migration or data clearing. See validation/appearance-change.md.
