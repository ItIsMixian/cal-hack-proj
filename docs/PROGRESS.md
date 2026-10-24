# 当前工作

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
