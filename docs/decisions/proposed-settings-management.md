# 统一 Settings 管理系统、人格资料与账号授权

Status: Proposed (2026-10-24). Existing Mirror Room covers part of the scope; unified Settings is not implemented.

来源：[原需求记录](../design/mirrorville-product-workflow.md)。用户要求 Settings 修改系统设置、人格资料和相关账号授权；此前助手将 authentication 理解为社交授权，尚待确认是否还包含密码等账号安全设置。

对照基线：本地 main `8c6b381e08ee0b0b050b90d63a99113aac67053e`；本次未 fetch。

## 与 main 的差异

main 已有 [Mirror Room](../../src/MirrorRoom.tsx) 编辑、删除／撤销卡片、导入与按房间控制资料可见性。[0005](0005-mirror-room-privacy.md) 明确 Mirror Room 是独立页面，不是设置弹窗。原用户要求还包括系统设置与账号授权，不能将 Mirror Room 的存在记为全部 Settings 已完成。

## 提案

- 提供统一 Settings 入口，组织系统设置、人格资料管理、相关账号授权管理。
- 资料编辑沿用 Mirror Room，保留它作为独立页面的决定；Settings 可导航过去，避免重复维护两套资料。
- 账号授权管理与 [Onboarding](proposed-onboarding-options.md) 的连接路径对应，支持用户回到相关管理入口；具体连接／撤销体验需进一步设计。

## 理由与替代方案

用户需要在开始体验后持续修改资料和授权。替代方案为保持所有资料管理都在 Mirror Room，只在将来加入账号功能时增加最少入口；是否使用 Settings 名称与最终导航仍待选择。

## 影响与待确认

- “系统设置”的具体项目尚未列出，不能据此补造主题、语言或通知需求。
- authentication 是否含密码、登录安全，需与 [账号提案](proposed-account-registration.md) 对齐。
- 不更改 0005 的隐私默认值；授权管理不等于资料自动对外可见。
