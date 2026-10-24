# MirrorVille 项目文档

本分支为 yq 的文档与个人 Proposed 快照。ADR 代表双方已达成共识的决定；只有 Proposed 表示正在考虑的想法。Accepted 与是否实现分别记录。

- [团队原则](core/principles.md)：沿用 main 原文。
- [当前工作](PROGRESS.md) · [交接](HANDOFF.md)
- [共识 ADR 与独立 Proposed 索引](decisions/README.md)
- [当前对话的原需求与讨论背景](core/discussion-context.md)
- [产品流程](design/mirrorville-product-workflow.md) · [仓库产品设计](design/product-pipeline.md)
- [当前结构](state/project-structure.md) · [计划](implementation/plans/README.md)
- [验证](validation/README.md) · [yq 交付](validation/2026-10-24-yq-branch.md)
- [资料与历史](library/README.md) · [backlog](backlog.md) · [DEVLOG](DEVLOG.md)

此前父目录 docs 的整理已移入本仓库，源码路径与引用按仓库位置调整。父目录副本没有自动同步；以本分支中的文档开展后续审阅。Activity Helper PRD 与赞助商资料副本在 library/originals，保留为独立参考，不当作 MirrorVille 的已接受需求。

离线阅读：在仓库目录执行 `python .agents/skills/orrery-docs-local/scripts/orrery_docs.py build --target .`。生成页 docs/_site/orrery-docs.html 不提交。
