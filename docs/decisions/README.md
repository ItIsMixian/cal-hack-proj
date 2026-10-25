> 合并说明（2026-10-24）：下方导入 cal-hack-proj 的既有决策索引；Accepted / Implemented 为源仓库记录，不代表本次新增用户批准或运行验证。根目录此前“尚无 ADR”的记录已归入 [历史基线](../library/history/2026-10-24-calhack-baseline.md)。
>
> [服务器方案](../library/mirrorville-server-options.md) 中原对话的公共／私人小镇和候选技术栈仍为 Proposed；已存在的技术决定以 0001 / 0007 为仓库来源。npm 命令在本仓库目录运行；本次只提交并推送个人分支，不修改 main。

# Decisions

当前协作口径：**ADR 是双方已形成共识的确定决定；只有 Proposed 表示最近正在考虑、尚待接受的想法。** 汇报“最近在想什么”时只列 Proposed，不混入 ADR 或已接受决定的实施计划。Accepted 与是否实现仍分别记录。

Each record covers one question: context, choice, reasons, alternatives, consequences. Status is
Proposed / Accepted / Superseded; Accepted does not mean implemented, so each file also says whether it
is implemented. Later decisions amend or supersede earlier ones instead of rewriting them.

## How we work on decisions (two people, two branches)

- Everyone works on their own branch off `main` (e.g. `yw/postcard-privacy`) and merges through a PR
  the other person has looked at.
- A new decision starts **unnumbered** as `proposed-<topic>.md` with `Status: Proposed`. Drafts on
  different branches never collide.
- Numbers are only assigned on `main`: when both agree, rename it to the next free number
  (`0007-<topic>.md`), set `Status: Accepted (date)`, and add it to the table below in the same PR.
- Ideas that nobody has evaluated yet go to `../backlog.md`, not here. A Proposed decision is a concrete
  choice with alternatives that only needs agreement.
- Accepting a draft: merge its branch's PR, then in a small follow-up on `main` give it the next number.
  If both of you drafted the same question, settle it into one file before either is numbered.

## Accepted

| # | Decision | Implemented |
| --- | --- | --- |
| [0001](0001-spacetimedb-rewrite.md) | Build from scratch on SpacetimeDB, no AI Town code | Yes |
| [0002](0002-model-split.md) | DeepSeek for mirror chatter, Claude for judgments | Partly (Claude path untested) |
| [0003](0003-postcards-and-waves.md) | No popups: postcards and mutual waves instead of yes/no (partly superseded by 0008) | Yes |
| [0004](0004-evidence-and-conduct.md) | Mirror conduct rules and evidence-checked connections (evidence rule under review) | Yes |
| [0005](0005-mirror-room-privacy.md) | Mirror Room: local redaction, facets, personal cards, per-room defaults | Yes (venue room only) |
| [0006](0006-marglo-as-a-source.md) | Marglo is one data source among many | No |
| [0007](0007-public-deployment.md) | Public deployment: Maincloud + static frontend, tunnels as fallback | No |
| [0008](0008-diary-and-mutual-interest.md) | Mirror diaries; visible interest; mutual interest unlocks contact details | Yes (validation: [0008](../validation/0008-diary-and-mutual-interest.md)) |

## Proposed

- [独立本机多世界测试后端](proposed-local-world-test-backend.md)：用户已授权本机测试部署；单活动世界、私有底表与成员视图等实现选择仍为试验，不自动升级为双方共识 ADR。

### 当前对话整理的本地提案（2026-10-24）

以下以本地 `main` 的 `8c6b381e08ee0b0b050b90d63a99113aac67053e` 为对照，最初整理于父目录 docs，本次纳入个人分支 yq。全部未编号、Status: Proposed；本次整理不表示项目协作者已接受，也不改变用户原始需求的来源。

| 提案 | 相对 main 的增量 | 来源 |
| --- | --- | --- |
| [邮箱账号登录与注册](proposed-account-registration.md) | 浏览器匿名身份之外的邮箱／密码／生日注册流程 | 用户明确需求 |
| [多种 Onboarding 输入与授权](proposed-onboarding-options.md) | 注册后统一引导、平台授权与进入条件；不重复提案已有 TIPI／36 问设想 | 用户需求；至少一种才进入为助手建议 |
| [Library 回顾与行动指导](proposed-library-review-and-guidance.md) | 上次访问以来的活动／相遇／事件和行为指导；复用已接受的 0008 日记 | 用户需求；保存后回顾效果的闭环为助手补充 |
| [统一 Settings](proposed-settings-management.md) | 系统与账号授权管理，资料部分沿用 Mirror Room | 用户明确需求；authentication 范围待澄清 |
| [社交媒体 Share](proposed-social-town-sharing.md) | 对外分享小镇；不同于公开部署和联系方式解锁 | 用户需求；预览与确认流程为助手建议 |
| [常驻公共与邀请制私人小镇](proposed-persistent-public-and-private-towns.md) | 明确常驻组织、真实成员／邀请规则；与本周末不做多世界的约束冲突 | 用户讨论的空间需求；组合与单镇限制为助手建议 |
| [拆分后端备选架构](proposed-layered-backend-alternative.md) | 保留独立 API／数据库／队列／AI Worker 的候选，与 0001 / 0007 比较 | 助手候选建议，未批准迁移 |

共同部分不再重提：AI 分身促成真人关系、云端持久活动、资料隐私、Mirror Room、main 已接受的 0008 日记与双方联系方式解锁。私人房间已出现在 main 的设计中；对应提案只整理原讨论中额外的组织规则与范围选择。

本地已缓存的 `origin/yw/proposals` 还包含 `proposed-postcard-privacy.md` 与 `proposed-creao-team-brief.md`。此前已通过 GitHub 读取这两篇 Proposed 原文，本次未导入或改写队友草稿；不要把这两篇算作当前对话新提出的内容。

### 源仓库分支协作约定

下方为源仓库原有约定。上表在本次 yq 分支中仍为个人 Proposed；双方接受前不合入 main，也不分配 ADR 编号。

Proposed drafts stay on their author's branch until accepted, so `main` only holds what both agree
on. To see everyone's drafts and spot clashes early, run `npm run check-decisions`: it fetches all
branches and lists, per branch, the decision and principle files changed since `main`, plus files more
than one branch is touching.
