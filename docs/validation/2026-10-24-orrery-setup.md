# Orrery 本地文档技能安装验证

日期：2026-10-24。范围：Calhack 本地文档；不包含应用功能验收。

## 输入与版本

- 用户提供归档：`orrery-docs-local-20261024.zip`。
- 技能名称：`orrery-docs-local`。
- 安装范围：项目级 `.agents/skills/orrery-docs-local/`。
- 原包包含 SKILL.md、README.md、LICENSE、scripts/orrery_docs.py；本次安装不修改原包内容。

## 已执行

- 阅读归档全部技能说明与 Python 脚本，确认其本地文档初始化和离线构建用途。
- 解压前验证归档根目录与目标路径；安装使用新建写入，不覆盖已存在的技能目录。
- 阅读现有根目录材料及文档入口候选路径，未发现已有 AGENTS 规则。
- 使用 Codex 自带 Python 执行 `init --dry-run`，输出 13 个待创建文件。
- 执行 `init`，实际创建上述缺失文件。
- 阅读并采用已安装的 SKILL.md，按用户对话整理文档。

## 交付前检查

以下检查已实际执行，通过；使用 Python 3.12.14 与原包脚本：

- PASS：归档与已安装的四个文件逐字节一致。
- PASS：现有两个作者文件的 SHA-256 与下方基线一致。
- PASS：重新运行初始化输出 13 个 SKIP；运行前后全部作者 Markdown 的摘要一致，没有覆盖。
- PASS：27 个相对 Markdown 链接均可定位到现有文件。
- PASS：离线阅读页构建成功；内嵌的 16 篇记录与 AGENTS 及 docs 作者 Markdown 的路径、内容完全一致。
- PASS：生成页声明 `connect-src 'none'`，无需后台服务读取本地内嵌资料。

## 原始文件校验基线

| 文件 | 安装前 SHA-256 |
| --- | --- |
| idea1_PRD_v0.1.md | E1BB4F5A7DF9BF88B65A3669C6628EE45D478A2B24DC26C9E8A21BDFFF3AEEF9 |
| Sponsor_Tracks_中文总结.md | 188E390FE0309109DA7FD01D40351F5294701BE775AAFB9CEBE616ECFB1B9689 |

## 环境与未覆盖项

- 系统 `py -3` 报告未安装 Python；实际执行使用 Codex 工作区依赖中的 Python 3.12.14。
- 未运行 MirrorVille 应用，未连接真实社交平台，未验证多人／分身后端。
- 本次安装未重新读取 FigJam 画布。
- 未验证普通浏览器中的点击、搜索或渲染；源码阅读页不提供富文本 Markdown 或图片预览。
- 后续新对话是否自动列出该技能，需在宿主重新发现技能后观察；当前对话已直接读取并应用安装文件。
