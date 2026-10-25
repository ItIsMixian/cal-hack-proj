# 邮箱重复输入调查

日期：2026-10-24（America/Los_Angeles）。本机代码检查与认证服务只读页面检查。

- `src/LoginScreen.tsx` 收集邮箱，并将其传入 `SessionRoot.tsx` 的登录动作。
- 登录动作仅调用 `signinRedirect({ prompt: 'login', login_hint: email })`，本地页面不发送验证邮件。
- 使用项目文档中的公开客户端 ID、已登记的 127.0.0.1 回调和虚构的 example.test 邮箱发起只读 OIDC 页面检查；即使携带 login_hint，实际托管页面的 email input 仍为空，Send magic link 按钮禁用。未点击发信按钮、未创建账号、未完成认证或发送邮件。
- 因此，当前托管登录集成会让用户先在应用填写邮箱，再在认证页填写邮箱。第一次输入没有在本次检查中预填第二页。
- 检查官方 React 集成说明和公开管理 API 文档，未找到可直接用于自定义界面发送登录链接的已确认公开接口；这不等于断言该服务不存在其他能力。浏览器同源策略也限制本地网页直接操作第三方认证页面。
- 当前本地 `.env.local` 仅配置共享数据库，不含认证客户端 ID；当前本地预览使用访客入口。上述认证检查独立访问托管服务，不代表本地完整账号登录已通过。

用户希望输入一次邮箱后直接显示发送结果。已讨论“仅在托管页输入一次”或“采用支持自定义邮箱登录的认证接口”；尚未选定替代方案，没有删除现有输入框、更换认证服务或实现直接发信。只有服务确认发送成功后才能显示已发送提示。

参考：[官方认证说明](https://spacetimedb.com/docs/core-concepts/authentication/)、[React 集成](https://spacetimedb.com/docs/core-concepts/authentication/spacetimeauth/react-integration/)、[公开管理 API](https://auth.spacetimedb.com/docs)。
