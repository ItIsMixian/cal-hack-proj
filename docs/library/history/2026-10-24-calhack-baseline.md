# 合并前 Calhack 文档原稿

日期：2026-10-24。以下保存合并前根目录 docs 的全部 12 篇作者 Markdown；代码块中的状态属于当时的记录，不是当前结论。原文按文件保存，未以仓库版本覆盖。当前入口见 [PROGRESS](../../PROGRESS.md)。

## docs/backlog.md

合并前 SHA-256：`440893b27dfa9f73478768f07a80fcb9191720a1740b8cff4ba94695292e1711`。

````markdown
# 待评估事项

这里的内容尚未批准为实现范围，也不表示已经完成。

1. 明确 Onboarding 进入条件：人格资料／社交授权的必填、任选与跳过规则。
2. 确定公共与私人小镇的关系、成员加入方式、邀请规则以及分身是否可同时在多个小镇活动。
3. 确认最小演示闭环、团队资源、交付日期和目标终端。
4. 确定后端技术栈、持久化与任务调度方式、AI 调用预算和初始用户规模。
5. 确定社交平台与授权数据范围；分开验收样本数据、真实读取和真实分享／发布。
6. 如需要多人版本协作，再建立 Git 仓库与分支审阅流程。
````

## docs/core/principles.md

合并前 SHA-256：`97ba10823fa7e9051d532aeea72d3002aeae94b532de7d42be9f0056bb503c94`。

````markdown
# 项目原则

更新日期：2026-10-24。来源：当前用户对话中的产品描述与功能要求。

## MirrorVille 已明确的方向

MirrorVille 是一个虚拟小镇。每位用户拥有 AI 分身，分身根据用户的身份、兴趣及获授权使用的社交媒体信息行动。用户通过查看分身在小镇中的社交经历，获得开启真人交流、认识新朋友、维系和加深现有关系的话题。

用户明确要求的功能范围：

- 登录与注册，注册收集用户名、邮箱、密码、生日。
- 注册后通过人格资料／问题与社交媒体授权，让 AI 更了解用户。
- Library 回顾自上次登录后的行动、相遇和事件，并允许添加内容来指导分身接下来的动作。
- Settings 管理系统设置、人格资料及相关账号授权。
- Share 将自己的小镇分享到社交媒体。

## 文档维护原则

- 用户明确要求与助手提出的建议分别记录。
- 用户目标、拟采用方案、实现现状和验证结果分开，不用设计图或计划证明代码完成。
- 保留既有材料。Activity Helper 的目标、2026-10-25 排期及优先级不自动转为 MirrorVille 的要求。
- 不为尚未确认的功能补造用户承诺或验收结果。

## 当前未确认的关键约束

- 人格资料和社交媒体授权是任选一项、两项必做，还是允许跳过。
- 一个共享世界、常驻公共小镇与私人小镇的最终选择。
- 初始用户规模、目标终端、技术栈、具体社交平台及真实 API 接入范围。
- MirrorVille 的演示截止时间和明确的最低可用闭环；现有最小演示建议尚未被用户确认。
````

## docs/decisions/README.md

合并前 SHA-256：`3bc15c1b29df1ff724e83d1f28aa9774a06a4697a4fd0d58635951540178e8b9`。

````markdown
# 决策索引

截至 2026-10-24，尚未建立产品或技术架构 ADR。用户要求采用 Orrery 维护文档，已记录于根目录 AGENTS 与 DEVLOG。

服务器技术栈、公共／私人小镇、Onboarding 必填规则尚未被用户明确接受，不得记为 Accepted；讨论材料见 [服务器方案](../library/mirrorville-server-options.md)。

后续重要决定每篇聚焦一个问题：背景、选择、理由、替代方案和后果。注明 Proposed / Accepted / Superseded。Accepted 不等于 Implemented；新决定可取代旧决定，不改写历史。
````

## docs/design/README.md

合并前 SHA-256：`54c7a20dd6378bc16f2095f32a6b479eb224e940b371eb7f108ab5fc6450684b`。

````markdown
# 设计

- [MirrorVille 产品与流程](mirrorville-product-workflow.md)：用户明确需求、当前设计资料及待确认条件。

设计资料不表示实现完成。架构选型尚未被接受，保存在 library 中；接受重要方案后再建立对应 ADR 与详细设计。
````

## docs/DEVLOG.md

合并前 SHA-256：`a9e11450dfe30946c4900e7e7c8937204ba4cb43194ac91736d63e23aba7940f`。

````markdown
# 变更记录

## 2026-10-24：安装 Orrery 本地文档技能并建立项目文档基线

- 来源为用户提供的 `orrery-docs-local-20261024.zip`，安装至项目 `.agents/skills/orrery-docs-local/`，包含 SKILL、README、LICENSE 和标准库 Python 脚本。
- 使用原包脚本预览并初始化缺失的文档目录，建立 AGENTS 入口。
- 整理 MirrorVille 用户明确需求、现有 FigJam 流程与尚未接受的服务器／房间建议；原 Activity Helper PRD 与赞助商资料保留。
- 生成离线 Markdown 源码阅读页；具体检查与未覆盖项见 [验证记录](validation/2026-10-24-orrery-setup.md)。
- 本次不包含应用开发、真实服务接入或自动后台维护。
````

## docs/HANDOFF.md

合并前 SHA-256：`aebc99eabe18677cf8c3eed4388a4cc32ca10026c5d61191f13d0a54a2e63e7e`。

````markdown
# 必要交接

更新日期：2026-10-24。

- 工作目录为 Calhack；本次对话聚焦 MirrorVille。已有 Activity Helper PRD 属于独立构想，不要直接覆盖或将其排期继承到 MirrorVille。
- 用户要求使用 `orrery-docs-local` 维护文档，技能已安装在 `.agents/skills/orrery-docs-local/`。这是本地文档版，没有自动协调或后台维护服务。
- MirrorVille 英文流程图位于 FigJam，入口见 [产品流程](design/mirrorville-product-workflow.md)。本次安装没有再次读取远端画布；图中细节以已有对话编辑记录为来源。
- “至少完成一种 Onboarding 方式”以及“公共常驻小镇 + 私人小镇”是助手建议，用户尚未明确接受。
- 当前目录不是 Git 仓库。需要团队版本协作时，再按用户要求选择仓库并初始化；此次安装未执行 Git 初始化。
- `py -3` 在本机报告未安装 Python。执行技能脚本使用了 Codex 自带 Python，可通过工作区依赖工具重新定位；脚本本身不需要第三方库。
````

## docs/implementation/plans/README.md

合并前 SHA-256：`ed2f027cae25aebd011ddd1a54d2a9048a7c2af1d43a1f950d101b1243e02d74`。

````markdown
# 实施计划

当前没有已批准的 MirrorVille 实施计划。现阶段为需求与方案整理，不能把 Activity Helper 的旧排期直接沿用。

确认范围后，每个活动计划说明预期结果、范围、边界、依赖与验收方法；计划不作为完成或验证证据。
````

## docs/library/README.md

合并前 SHA-256：`cee5d5928f444e628645a9743f6c4ba553125f46880ea0f3f466f8a0ff654019`。

````markdown
# 资料索引

研究与参考不自动成为项目决定。

## 既有作者材料

- [Activity Helper PRD v0.1](../../idea1_PRD_v0.1.md)：独立产品构想，保留原稿；未确认废弃或替换。
- [赞助商赛道中文总结](../../Sponsor_Tracks_中文总结.md)：既有截图整理，不能当作本次已核验的最新官方规则。

## 本次对话方案

- [MirrorVille 服务器与房间模式](mirrorville-server-options.md)：助手提出的选项与建议，尚未获得用户明确接受。

离线阅读页只打包 AGENTS 和 docs 中的 Markdown；上面两个根目录原始文件保留在原位置，未复制到阅读页。
````

## docs/PROGRESS.md

合并前 SHA-256：`1da174886bd1fd42b67a9b9cfdb36a044bb46c4ecfd4a47ee612a7178e902123`。

````markdown
# 当前工作

更新日期：2026-10-24。

## 当前目标

按用户要求安装并采用 Orrery 本地文档技能，整理本次 MirrorVille 产品讨论，保留已有项目材料。

## 导航

- 产品需求与英文流程图：[产品流程](design/mirrorville-product-workflow.md)。
- 已确认目标与未决约束：[项目原则](core/principles.md)。
- 本地文件与实现边界：[当前状态](state/project-structure.md)。
- 服务器、公共／私人小镇建议：[方案讨论](library/mirrorville-server-options.md)，状态 Proposed。
- 安装及离线阅读页检查：[验证记录](validation/2026-10-24-orrery-setup.md)。

## 当前交付边界

本次交付为项目级技能和文档基线。工作区未发现应用代码或 Git 仓库；没有应用运行、真实 OAuth、AI 模拟或多人同步的通过证据。下一步需要确定 MirrorVille 的房间模式与原型范围，再建立对应实施计划。
````

## docs/README.md

合并前 SHA-256：`d8373ead7dea7cd3dfb2e400494d0fe9b0f7fa71d561ba8a554ed933a114bae9`。

````markdown
# Calhack 文档

本目录于 2026-10-24 使用 `orrery-docs-local` 初始化。当前对话聚焦 MirrorVille；已有 Activity Helper PRD 独立保留。

- [当前工作](PROGRESS.md)
- [项目原则与已确认目标](core/principles.md)
- [MirrorVille 产品与流程](design/mirrorville-product-workflow.md)
- [当前项目结构与实现边界](state/project-structure.md)
- [服务器与房间方案讨论，尚未采纳](library/mirrorville-server-options.md)
- [决策索引](decisions/README.md)
- [实施计划索引](implementation/plans/README.md)
- [验证记录](validation/README.md)
- [交接](HANDOFF.md) · [变更记录](DEVLOG.md) · [待评估事项](backlog.md)

根目录原始材料见 [资料索引](library/README.md)。所有状态以作者文档与实现证据为准；`_site/orrery-docs.html` 是可重建的离线源码阅读页，不是产品部署。
````

## docs/state/project-structure.md

合并前 SHA-256：`fc6fc670d1a256e91a53c64277d329f906260e96f79af0d09b99b9aa5c557aa0`。

````markdown
# 项目结构与当前状态

检查日期：2026-10-24。来源：安装前目录枚举、现有文件阅读、安装与构建命令。

## 安装前已有文件

| 文件 | 内容与边界 |
| --- | --- |
| `idea1_PRD_v0.1.md` | Activity Helper：个性化活动管理工具生成器的 PRD，不是 MirrorVille PRD |
| `Sponsor_Tracks_中文总结.md` | 根据活动截图整理的赞助商资料；本次未重新核验外部规则 |

目录枚举未发现应用代码；`git status --short` 报告当前目录不是 Git 仓库。因此不能宣称功能已经开发、部署或通过验收。

## 本次新增

- `.agents/skills/orrery-docs-local/`：用户提供的项目级文档技能。
- `AGENTS.md`：后续任务的技能与文档阅读入口。
- `docs/`：原则、设计、方案讨论、现状、验证与交接记录。
- `docs/_site/orrery-docs.html`：由原包脚本生成的离线源码阅读页，可重建，不是应用主体。

## 设计资料与实现状态

本次对话已编辑 MirrorVille 登录、注册、Onboarding 与主界面功能的英文 FigJam 流程图。链接见 [产品流程](../design/mirrorville-product-workflow.md)。这是设计产物，不构成代码或真实后端运行证据；本次安装未重新读取远端。

登录／注册、AI 自主活动、多人共享状态、社交媒体数据读取与分享／发布：当前工作区没有对应实现和验证证据。
````

## docs/validation/README.md

合并前 SHA-256：`db53d73d84442525cf647da11e7cf2a9c9f5fd94e761f0cb78d43bb2ce76edb1`。

````markdown
# 验证记录

- [2026-10-24：Orrery 安装与文档基线](2026-10-24-orrery-setup.md)。

记录日期、确切材料版本、检查方法、实际结果和未覆盖项。未执行的检查写 Pending；安装或文档构建成功不表示 MirrorVille 应用通过验收。
````
