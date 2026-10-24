# Handoff / 必要交接

- 当前检出个人分支 yq；本次交付为合并文档与 7 篇未编号 Proposed，不修改 main。
- 用户明确：ADR 是双方已经形成共识的确定文件；只有 Proposed 是最近在考虑的想法。汇报两者必须分开，未实现的 ADR 也不是新的 Proposed。
- 从 [PROGRESS](PROGRESS.md)、[团队原则](core/principles.md) 与 [决策索引](decisions/README.md) 开始；原对话背景在 [discussion-context](core/discussion-context.md)，不能据此覆盖共识。
- 团队原则与 ADR 0001–0008 保留 main 原文。Proposed 接受前不编号、不改为 Accepted，也不改变既定原则。
- 父目录整理已纳入本仓库 docs，相对代码路径以本仓库为根。父目录副本无自动同步；历史验证的旧目录与版本描述不代表本次状态。
- 当前代码仍为 Postcards / waves / private chat；0008 已接受但未实现。原始 Library / Settings / Share 与账号需求的差异列在个人 Proposed。
- Activity Helper PRD 与赞助商资料保留独立参考副本；FigJam、赛事规则与外部 API 本次未重新核验。
- 分支交付范围和检查见 [验证记录](validation/2026-10-24-yq-branch.md)。未运行应用、调用模型或部署服务。

## main 原有操作交接

以下保留原交接内容；命令在本仓库目录运行，原开发机情况不代表本机验证。数据清空说明不构成本次执行授权。

# Handoff

Things that are not obvious from the code.

- **Run locally**: `spacetime start`, then `spacetime publish mirrorville --module-path spacetimedb --server local --yes`,
  `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`, `npm run dev`.
  After changing the module, publish and regenerate bindings.
- **Schema changes wipe data.** Changing columns needs `--delete-data=always`, which clears everything,
  including model keys. Run `npm run set-keys` again afterwards.
- **Keys**: `npm run set-keys` prompts with hidden input (paste with right-click in Windows terminals;
  Ctrl+V may not paste in raw mode). It stores keys through the database's HTTP API using
  `SPACETIMEDB_ADMIN_TOKEN` from `.env.local`, which is the publisher identity's local token. Never commit
  `.env.local`.
- **On the original dev machine** the SpacetimeDB CLI was installed inside the coding agent's sandbox,
  so it is not on the real PATH. Anyone else should install the CLI normally (spacetimedb.com/install).
- **PowerShell** blocks `npm`/`npx` scripts on that machine; use `npm.cmd` / `npx.cmd`.
- **Demo mirrors** (Yun, Marco, Priya, Sam, Lena) are owned by the publisher, always wave back, and only
  chat among themselves at a reduced rate.
- **Docs reader**: `python .agents/skills/orrery-docs-local/scripts/orrery_docs.py build --target .`, then open
  `docs/_site/orrery-docs.html` (generated, gitignored).
