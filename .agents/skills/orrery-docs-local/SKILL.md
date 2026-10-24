---
name: orrery-docs-local
description: Organize and maintain a project's Markdown documentation with Orrery principles, decisions, designs, plans, current state and validation records; scaffold documentation or build its offline reader when requested. Documents only, without agent task tracking or coordination services.
---

# Orrery 本地文档版

这是临时文档版，不包含任务状态、Graph、自动协调、执行准入、AI问答或后台服务。

## 在已有项目中工作

先读项目自己的AGENTS.md及必要的HANDOFF、PROGRESS、principles，再按问题读取相关State、有效ADR、活动Plan和实际代码。复用已读且未变的上下文，不为小改动重复全库阅读。现有项目规则优先，不把本Skill视为已采纳项目文档体系。

- `docs/core/principles.md`：项目目标和不变量。
- `docs/decisions/`：重要决定及理由。accepted不等于implemented；后续决定可amend/supersede旧决定，不改写历史。
- `docs/design/`：接受方案的设计细节。
- `docs/implementation/plans/`：计划怎样做，不冒充实现证据。
- `docs/state/`：有实际来源的当前事实、边界和已知缺口，不是Agent运行状态。
- `docs/validation/`：验证方法、版本、结果及未覆盖项。
- `docs/PROGRESS.md`：当前工作导航，不复制所有流水。
- `docs/HANDOFF.md`：必要接续信息；`docs/DEVLOG.md`记录完整交付或重要变更。
- `docs/library/`：参考/研究，不能自己变成批准；`docs/backlog.md`保存待评估想法。

只更新事实变化影响的文档。普通修复不机械新建ADR；重要跨模块约束才记录决定。引用实际代码/验证，不把推测、计划或Agent回执写成通过。保留现有作者内容，遇冲突先展示差异。两个协作者通过自己的Git分支和审阅合并文档，不启用额外同步或状态系统。

## 初始化（只有用户要求时）

使用本Skill目录中的脚本，Python 3.10+，无第三方依赖：

```text
python scripts/orrery_docs.py init --target <项目目录> --dry-run
python scripts/orrery_docs.py init --target <项目目录>
```

命令从Skill目录运行，或使用脚本绝对路径。只新增缺失文件，已有文件SKIP，不覆盖AGENTS或作者文档。脚手架中的“待填写”不是项目事实；与用户确认项目目标后再补齐。已有AGENTS需要人工合并阅读入口，不自动追加。

## 本地阅读

```text
python scripts/orrery_docs.py build --target <项目目录>
```

手动打开输出的`docs/_site/orrery-docs.html`。页面离线导航、搜索及阅读Markdown源文，保持代码块/中文原貌；这是轻量源码阅读器，不是完整Observatory，也不提供富文本Markdown渲染。修改文档后手动重建，不开服务、不调用Git/API或自动更新。不要手工编辑生成页，也不要把它当权威文档。
