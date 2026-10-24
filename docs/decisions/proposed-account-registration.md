# 邮箱账号登录与注册

Status: Proposed (2026-10-24). Not implemented as a complete flow.

来源：之前对话中用户明确提出的 Login / Registration 流程，见 [原需求记录](../design/mirrorville-product-workflow.md)。Proposed 表示尚待与 main 对齐并由项目协作者接受，不把用户的需求降格为助手建议。

对照基线：本地 cal-hack-proj 的 main，`8c6b381e08ee0b0b050b90d63a99113aac67053e`；本次未 fetch。

## 与 main 的差异

main 的 [main.tsx](../../src/main.tsx) 使用保存在浏览器 localStorage 的 SpacetimeDB 匿名身份；[CreateMirror](../../src/CreateMirror.tsx) 创建分身，不是邮箱账号注册。[仓库原则](../core/repository-principles.md) 希望评委一分钟内进入演示。

## 提案

- 应用提供 Login：邮箱、密码、失败重试，以及进入注册的入口。
- Registration 收集用户名、邮箱、密码、生日；完成后进入“Help Your AI Get to Know You”，见 [Onboarding 提案](proposed-onboarding-options.md)。
- 已有账号登录后回到软件主体；Onboarding 是否完成以及是否需要继续补充，按最终确认的进入条件处理。

## 理由与替代方案

邮箱账号用于用户再次回到同一身份，符合原对话的登录／注册体验。替代方案为维持 main 的匿名身份快速演示，或保留匿名体验后再绑定账号；后两者是供评审的取舍，本次未选定。

## 影响与待确认

- 需要决定账号如何关联现有 SpacetimeDB identity、分身及资料，不能把新增表单视作登录已实现。
- 生日字段的用途、是否必填，以及是否保留匿名快速体验仍待确认。
- 真实登录、失败处理和跨会话身份连续性需后续实现验证。本提案不改变 main 或本次演示排期。
