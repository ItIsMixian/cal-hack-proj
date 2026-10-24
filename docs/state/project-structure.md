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
