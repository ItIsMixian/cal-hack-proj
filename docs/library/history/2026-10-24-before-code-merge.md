# Documentation preserved before the code merge

2026-10-24. Historical source text, not the current implementation status. Current navigation is in [PROGRESS](../../PROGRESS.md).

## yq 1f404a9: docs/PROGRESS.md

````markdown
# 当前工作

最新快照：[Home.tscn](../mirrorvile/Home.tscn) 与 5 张新增图片、对应导入文件随本次 yq 提交上传；工程与场景共 26 处资源引用检查通过，未运行 Godot。

最新地图快照：[Town map.tscn](../mirrorvile/Town%20map.tscn) 与新增地图素材随本次 yq 提交上传。已检查 21 处资源引用，未运行 Godot 或验证互动。

最新交付：按用户要求将 mirrorvile/ Godot 工程与现有素材快照上传到个人分支 yq；见 [结构说明](state/project-structure.md)。只做文件及资源引用检查，未运行或集成 Godot。

更新日期：2026-10-24。文档合并后，已按用户要求将之前讨论中与 main 不同的想法整理为 7 篇未编号 Proposed；没有执行产品开发或部署。

本次交付：按用户要求将合并文档与 Proposed 纳入个人分支 yq 并推送；[交付与验证](validation/2026-10-24-yq-branch.md)。ADR 只表示已达成共识的决定，“最近想法”只看 Proposed。

## 当前目标与导航

产品方向是 MirrorVille。仓库演示目标为评委创建分身、观察小镇、回顾日记并表达兴趣；仓库记录的首次 Devpost 提交目标为 2026-10-25 09:00 PT，未独立核验。当前对话的登录、Library、Settings、Share 需求仍保留，差异见 [项目原则](core/discussion-context.md)。

- 当前代码与缺口：[项目结构](state/project-structure.md)。
- 为什么这样设计：[ADR 0001–0008](decisions/README.md)；[仓库产品设计](design/product-pipeline.md)。
- 原始用户需求与 FigJam：[产品流程](design/mirrorville-product-workflow.md)。
- 本次合并：[差异处理](library/docs-merge-notes.md)、[验证](validation/2026-10-24-docs-merge.md)。
- 待讨论的差异：[Proposed 索引](decisions/README.md#proposed)，含账号、Onboarding、Library、Settings、Share、小镇组织和备选后端；[本次整理验证](validation/2026-10-24-discussion-proposals.md)。

## 仓库导入的后续优先级

以下为源 PROGRESS 的下一步，没有因合并变成已完成或当前用户新增承诺：

1. 按 [0008 活动计划](implementation/plans/0008-diary-and-mutual-interest.md) 实现日记、可见兴趣、双方联系方式解锁及 Mirror Room 联系字段。
2. 按 [0007](decisions/0007-public-deployment.md) 先验证 Maincloud procedure 能否调用 DeepSeek，再处理公开部署。
3. 讨论源文档提到的 `yw/proposals` 上 postcard privacy 与 CREAO team brief 草稿；此前已读取远端对应的两篇 Proposed；这是队友尚在考虑的内容，与 Accepted ADR 分开。
4. 验证 [0002](decisions/0002-model-split.md) 的 Claude 判断路径；源记录没有 Anthropic 路径通过证据。
5. 演示脚本、视频备份、Devpost 页面与现场真实使用。

其他待对齐需求与未评估构想见 [backlog](backlog.md)。

## 本次交付边界

已导入源码仓库的设计、ADR、计划及历史验证，并将当前对话的差异整理为 Proposed。提案区分用户要求和助手建议，注明已有重叠与范围冲突；没有更改 Accepted ADR、团队原则或 main。源码静态检查确认原型代码存在；没有在本机运行应用、调用模型、验证 OAuth、双用户同步或公开部署。应用代码和原始 Activity Helper PRD、赞助商资料保持原样；参考副本随文档纳入本分支。
````

## yq 1f404a9: docs/state/project-structure.md

````markdown
# 项目结构与当前状态

新增 [mirrorvile/Home.tscn](../../mirrorvile/Home.tscn)：Home 根节点下有 Background、Bookshelf、Mirror、Diary、Carddesk 图像节点。当前证据为场景文本及资源文件，未验证运行或点击互动。

最新地图文件为 [mirrorvile/Town map.tscn](../../mirrorvile/Town%20map.tscn)，包含 Coffee、Body_builder、Restaurant、Park、Clockbuilding、Farm 等场景节点，House / Decoration 使用 TileMapLayer。该描述来自场景文本静态读取，不代表地图或角色互动已经运行验证。

## Godot 工程快照（2026-10-24）

按用户要求将 [mirrorvile 工程](../../mirrorvile/project.godot) 纳入 yq。工程配置声明 Godot 4.5 / Forward Plus，包含 Player1.tscn、Player2.tscn 与 ArtAsset 素材目录；.godot 缓存不提交。本次只核对文件与资源引用，未运行 Godot，不表示主程序技术栈或任何共识 ADR 已变更。

检查日期：2026-10-24。来源：本地文件、cal-hack-proj HEAD `8c6b381e08ee0b0b050b90d63a99113aac67053e`、实际源码静态阅读及导入的历史记录。本次未运行应用。

## yq 分支交付补充

此前父目录合并后的文档现已纳入本仓库 docs。下表及历史章节中的 cal-hack-proj 路径是导入时的父目录布局；本分支的应用根目录就是仓库根目录。共识原则见 [core/principles](../core/principles.md)，父目录讨论背景保存在 [discussion-context](../core/discussion-context.md)。ADR 与 Proposed 不混合汇报。

## 导入时工作区布局

| 路径 | 内容与边界 |
| --- | --- |
| [cal-hack-proj](../../README.md) | MirrorVille 应用 Git 仓库，本次读取时分支 main；源码位于 src/ 和 spacetimedb/src/ |
| docs/ | 本次合并后的文档入口，不是应用代码 |
| [项目技能](../../.agents/skills/orrery-docs-local/SKILL.md) | 本地 Orrery 文档维护与离线阅读页构建 |
| [Activity Helper PRD](../library/originals/idea1_PRD_v0.1.md) | 独立构想原稿，不是 MirrorVille PRD |
| [赞助商资料](../library/originals/Sponsor_Tracks_中文总结.md) | 既有截图总结，未重新核验官方规则 |

## 本次静态核对确认的代码

- [package.json](../../package.json)：React、Vite、TypeScript、SpacetimeDB SDK 及构建、生成绑定等脚本。
- [main.tsx](../../src/main.tsx)：浏览器匿名身份令牌保存在 localStorage，连接 SpacetimeDB；不是邮箱密码注册或真实社交 OAuth。
- [App.tsx](../../src/App.tsx)、[CreateMirror.tsx](../../src/CreateMirror.tsx)：Town / Postcards、Mirror Room、分身创建和 TIPI；没有原需求 Login / Registration / Library / Settings / Share 的完整入口。
- [后端模块](../../spacetimedb/src/index.ts)：世界 tick、模型调用 job、分身创建、postcards、wave、human_message、导入和按用户暴露的 views。
- [隐私默认值](../../spacetimedb/src/redact.ts)：不同 facet、personal 标记、房间覆盖共同决定可见性；不是所有新卡一律隐藏。
- [llm.ts](../../spacetimedb/src/llm.ts)：DeepSeek 对话与 Claude 判断分流代码存在；本次未调用或确认模型可用性。

完整模块表及已有能力描述保存在 [源仓库结构记录](repository-structure-0d59463.md)。其基线为 `0d59463`；本次静态核对 HEAD 为 `8c6b381`。源 [端到端验证](../validation/2026-10-24-local-e2e.md) 不能当成本机 HEAD 重跑。

## 已有代码与计划的分界

| 项目 | 当前证据与缺口 |
| --- | --- |
| 小镇、分身互动、Mirror Room、postcards / waves / 私聊 | 有代码，另有源仓库 0d59463 的历史验证；本次仅静态阅读 |
| 日记、可见兴趣、双方联系方式解锁 | 0008 Accepted，有活动计划；源码仍为 postcard 路径，未见实现 |
| 多小镇／私人邀请房间 | venue 为现有实现；teammates / friends 只有可见性设置，不能记为完整房间 |
| 公开部署 | 0007 Accepted，源记录 Not implemented；本次没有部署证据 |
| Claude 判断 | 有调用代码，历史验证未覆盖；本次未运行 |
| 邮箱密码注册、生日、社交账号授权、Share 发布 | 当前原型没有对应完整实现与验证证据，原用户需求仍保留 |

## 历史与验证

合并前根目录“未发现代码、无 Git”的描述保存在 [基线原稿](../library/history/2026-10-24-calhack-baseline.md)，不再作为当前工作区结论。历史安装与应用验证各保留原范围；本次合并检查见 [验证记录](../validation/2026-10-24-docs-merge.md)。
````

## yw/map-assets cd9a191: docs/PROGRESS.md

````markdown
# Current work

Goal: a demo where a judge makes a mirror, watches it live in town, reads its diary, and shows
interest in someone (see `core/principles.md`). Deadline: Devpost first submission Sun 2026-10-25 09:00 PT.

## Where things are

- What exists: `state/project-structure.md`. What has been checked: `validation/`.
- Why it is built this way: `decisions/` (0001-0008). Product thinking: `design/product-pipeline.md`.

## Entry screen

The team's Figma login screen is implemented with local exported assets. SpacetimeAuth accounts and
explicit browser guests are integrated; see `validation/login-figma-and-auth.md` for user-assisted
login, verified guest compatibility and Pending cross-browser/expiry checks. The auth project is
configured on Maincloud, while the town simulation remains local.

Phone entry layout, compressed production sharing and the current tunnel's exact auth callbacks
were repaired after phone feedback; see `validation/mobile-login-and-share-performance.md`.

## Next

Teammate-authored town art and full-screen General/Follow cameras are integrated on
`yw/map-assets`; see `validation/authored-town-and-camera.md`. Teammate's Home scene is also
integrated; see `validation/authored-mirror-room.md`.

Mirror fidelity Parts A/B are implemented and locally tested on `yw/fidelity`; see
`validation/mirror-fidelity-a-b.md`. Owner judgment of the summary/cards and the rebase after diary
merges into main remain Pending. Part C is not included.

1. Diary, visible interest, contact unlock and Mirror Room contact field implemented (0008); see
   `validation/0008-diary-and-mutual-interest.md` for acceptance results and remaining checks.
2. Public deployment (0007): first check that a Maincloud procedure can call DeepSeek.
3. Agree on the remaining drafts on branch `yw/proposals`: postcard privacy, CREAO team brief
   (`npm run check-decisions` lists drafts on every branch).
4. Anthropic key → validate the Claude judgment path (0002).
5. Pitch: demo script, video backup, Devpost page; collect real usage at the venue.

Ideas nobody has evaluated yet live in `backlog.md`. Branch and decision-numbering rules are in
`decisions/README.md`.
````
