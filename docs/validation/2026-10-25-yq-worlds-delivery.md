# 当前工作交付到个人分支 yq

2026-10-25。用户明确要求把目前工作 push 到自己的 branch。

## 分支与范围

- 实际仓库为 cal-hack-proj，当前分支 yq，upstream origin/yq，远端为 ItIsMixian/cal-hack-proj。fetch 后提交基线 d85c3ed，与 origin/yq 左右差异均为 0。使用普通提交／push，不覆盖远端历史、不修改 main。
- 当前未提交源码包含本机多世界后端、私有视图与生成绑定、独立分身及原型、小镇位置导航／设置／邀请／发现、初始 Mirror Room、房间出发动画和公共小镇检索。保留工作区其他已有日记／类型适配及文档改动，一并作为用户要求的当前工作快照。
- 包含原 departure 原型、运行素材及许可、名称牌素材、自动化脚本、文档与验证截图。此处是代码和文档交付；不是新一次后端／公网部署。
- `.local-backend/`、`.env.local`、`.env.worldtest.local`、node_modules、dist、日志及 docs/_site 阅读页维持忽略；没有复制父目录独立文档来覆盖子仓库作者内容。

## 实际提交前检查

- 候选文件初始扫描共 112 个（约 6.1 MB），74 个文本文件。常见私钥头、GitHub/API token、JWT 及完整邀请链接 token 模式扫描无匹配；候选路径无本机环境／密钥／日志／依赖／构建目录，单文件无超过 20 MB 项。此为模式检查，不声称通用秘密扫描能证明所有内容均无敏感性。
- `git check-ignore` 实际确认上述本机环境配置、签名私钥及生成阅读页被忽略。
- `npm.cmd run build`：TypeScript + Vite worldtest 生产构建通过。
- `node node_modules/typescript/bin/tsc --noEmit --project spacetimedb/tsconfig.json`：后端检查通过。
- `node --test scripts/test-diary.mjs scripts/test-diary-comments.mjs scripts/test-diary-window.mjs scripts/test-roaming.mjs scripts/test-home-scene.mjs scripts/test-town-navigation.mjs scripts/test-world-journey.mjs`：69 项通过。
- 首次运行该集合发现旧公共发现测试读取满员小镇 memberCount，与已实现的“只列出可加入小镇”冲突。修正为满员时列表为空，并验证容量扩大后未加入用户重新发现、已加入用户继续被排除；复跑全部 69 项通过。
- 工作区 `git diff --check` 通过。加入未跟踪文件后，暂存检查仅报告四个原样导入的 departure LICENSE 文本自带尾随空白；为保留许可和素材来源的字节一致性不改写它们，排除这四个许可文件后的暂存检查通过。离线文档阅读页重建。
- 既有 Status card 测试历史问题见本机后端交付记录，本轮没有将其计入通过集合。没有重复生成后端测试身份或提交实际加入操作。

远端同步以本次普通 push 的结果及最终 HEAD / origin/yq 核对为准；提交身份和哈希可通过 Git 历史查看。
