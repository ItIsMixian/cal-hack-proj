# 本地前端连接共享小镇

日期：2026-10-24（America/Los_Angeles）。本机运行与浏览器验证。

- 按用户提供的共享数据库地址，新建应用目录 `.env.local`，只配置 `VITE_SPACETIMEDB_HOST` 和 `VITE_SPACETIMEDB_DB_NAME=mirrorville`；`git check-ignore` 确认该文件被忽略。没有复制或设置密钥。
- 复用已经安装的依赖，运行 `npm.cmd run dev -- --host 127.0.0.1`。本地入口 `http://127.0.0.1:5173/`。
- 浏览器选择 Explore as a guest 后显示 Live，接收到 12 个分身；没有创建分身或提交业务数据修改。见[共享小镇截图](shared-preview-assets/live-town.png)。
- 实际预览发现地图加载失败：`Trees, stumps and bushes v2.webp` 的逗号被 `encodeURIComponent` 编码为 `%2C`，Vite 静态路径处理未找到文件并返回入口 HTML。改用 `encodeURI` 保留该素材文件名中的逗号。
- 修正现有素材测试，按静态服务器路径解码并以字面文件路径读取，避免文件 URL 隐式解码掩盖问题。旧实现复现 ENOENT，修复后地图测试 6/6 通过。
- 热更新后浏览器地图正常显示，canvas 的 `data-town-renderer` 为 `authored`，仍显示 Live / 12 mirrors。
- `npm.cmd run build` 通过，未部署前端或发布数据库。

共享地址依赖对方电脑、数据库和隧道持续运行；地址变更后更新 `.env.local` 并重启 Vite。访客创建角色等操作会写入共享小镇。真实邮箱登录、创建角色及实体手机不在本次检查范围。
