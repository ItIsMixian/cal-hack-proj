# 多种人格输入与社交媒体授权的 Onboarding

Status: Proposed (2026-10-24). Not implemented as a complete flow.

来源：[原需求与流程记录](../design/mirrorville-product-workflow.md)。人格资料／问题和社交媒体授权来自用户；“至少完成一种才能进入、未完成者下次继续”来自助手补充，用户尚未接受。

对照基线：本地 main `8c6b381e08ee0b0b050b90d63a99113aac67053e`；本次未 fetch。

## 与 main 的差异

main 的 [CreateMirror](../../src/CreateMirror.tsx) 需要填写 TIPI 十题、名字和当天 intent；Mirror Room 支持 WhatsApp／粘贴文字导入。[仓库产品设计](../design/product-pipeline.md) 已提到 Aron 36 问和多种资料来源，因此本提案不把“多来源”或“36 问”本身当成新想法。新增差异是注册后的统一引导、真实账号授权，以及输入方式的选择和进入条件。

## 提案

- 注册后提供“Help Your AI Get to Know You”引导，把人格资料／问题与社交媒体授权作为两类可选路径呈现。
- MBTI、星座、Aron 36 问保留为用户举过的候选，不据此认定全部采用或全部必填；TIPI 是否保留也需要一并选择。
- 社交媒体授权与手动上传聊天导出分开描述，不能把文本导入标作平台授权。
- 将“至少完成一种才进入，未完成者再次登录回到引导”列为待选择的助手建议，而非既定门槛。

## 理由与替代方案

用户希望分身基于更多个人信息了解自己。替代方案为沿用 TIPI 后进入小镇、以后在 Mirror Room 补资料，或允许跳过整个引导。选择应兼顾 main 的低输入负担和快速体验目标。

## 影响与待确认

- 必填、任选、两类都做或允许跳过，尚未决定。
- 具体平台、授权范围、撤销入口、资料进入 Mirror Room 的方式尚未决定；授权不等于允许绕过 [0005](0005-mirror-room-privacy.md) 的可见性规则。
- 后续需分别验证问卷输入、真实授权和导入后的资料可见性。本次不承诺任何平台 API 已可用。
