# 2026-10-24 文档合并验证

范围：根目录 docs 与 cal-hack-proj/docs 的文档合并；不包含应用开发、运行或部署。

## 输入与版本

- 根目录合并前有 12 篇作者 Markdown，已完整保存在 [基线原稿](../library/history/2026-10-24-calhack-baseline.md)，每篇附原 SHA-256。
- 源仓库 HEAD：`8c6b381e08ee0b0b050b90d63a99113aac67053e`，分支 main，提交说明 `Add implementation plan for 0008`。
- 源 [本地 E2E](2026-10-24-local-e2e.md) 的运行基线是 `0d59463`，不提升为本次 HEAD 的测试结果。
- 构建工具：项目原有 `.agents/skills/orrery-docs-local/scripts/orrery_docs.py`；解释器为 Codex 工作区依赖 Python。没有安装新依赖。

## 实际检查

- PASS：源仓库工作树的 91 个非 Git 内部文件，在合并前后的 SHA-256 一致；源 docs、源码及已有生成页均未修改。
- PASS：根目录 AGENTS、Activity Helper PRD、赞助商资料共 3 个文件的 SHA-256 不变。
- PASS：从历史基线逐篇提取 12 篇原文，按原换行和 UTF-8 编码恢复后与合并前 SHA-256 一致，作者内容保留。
- PASS：合并后有 31 篇 docs 作者 Markdown；检查 AGENTS 与这些文档中的 100 个相对链接，全部能定位到现有文件。历史原稿代码块中的旧链接按原文保留，不作为当前导航检查。
- PASS：使用原脚本重新构建离线阅读页；32 条内嵌记录（AGENTS + 31 篇文档）的路径和正文与作者文件完全一致；页面保留 `connect-src 'none'`。
- PASS：子仓库 Git 状态与合并前一致，仅有此前已存在的 3 篇未跟踪文档；本次没有新增子仓库改动。

## 合并差异与未覆盖项

- 主要冲突和处理见 [合并说明](../library/docs-merge-notes.md)。本次没有新增 Accepted 决策，也没有把原始用户需求标记为被替代。
- 只静态阅读代码和历史记录，没有启动 SpacetimeDB / Vite、调用 DeepSeek / Claude、验证双用户、真实 OAuth、社交媒体发布或公开部署。
- 没有重新读取 FigJam、核验赛事／赞助商规则或拉取其他分支。
- 未在浏览器手动操作离线阅读页的搜索／点击；只检查构建产物及其嵌入数据。
- 没有 Git 提交、推送或自动同步；合并结果在父目录 docs，子仓库原稿保留。
