# Backlog

Ideas nobody has evaluated yet. Once an idea becomes a concrete choice, write it up as a Proposed
decision in `decisions/` and remove it from here.

- **Triadic referral**: "You should meet Marco; he also wants to go to the gym" from a mirror's memory.
- **Rooms**: Finding teammates (shared goal), Old friends (private, invite-only). Visibility settings already exist.
- **Is 0004's evidence rule too strict?** Exact phrases from both sides may reject good matches.
  Options discussed: only require that the cited information exists (not exact wording), or drop the
  check and keep only the three reasons and the daily cap. Parked; decide later.
- **Group conversations** of three or four at the café or food court.
- **More sources**: Messenger/Facebook export (slow; not on the demo path), the 36 questions asked
  conversationally by the mirror, GitHub/Devpost profile, Marglo (0006). Optional local model (Ollama) for card extraction.
- **Voice layer**: message length and emoji habits so a mirror sounds like its owner.
- **Moss** for memory retrieval; **Figma** design log for the Figma track.


## 根目录需求与仓库原型待对齐

2026-10-24：此前讨论中已有具体方向的差异，按用户要求移至 [Proposed 索引](decisions/README.md#proposed)。具体未决问题留在各提案中；移出本节不表示已批准或实现：

- [账号注册](decisions/proposed-account-registration.md)与 [Onboarding](decisions/proposed-onboarding-options.md)：邮箱密码生日、平台授权、问卷及进入条件。
- [Library](decisions/proposed-library-review-and-guidance.md)、[Settings](decisions/proposed-settings-management.md) 和 [Share](decisions/proposed-social-town-sharing.md)：原用户入口如何与 main 的 Diary / Mirror Room 对齐，以及真实读取、授权和发布的分项验证。
- [常驻公共／私人小镇](decisions/proposed-persistent-public-and-private-towns.md)：组织、成员与邀请、分身同时加入的规则；与本周末范围的冲突。
- [备选拆分后端](decisions/proposed-layered-backend-alternative.md)：此前助手候选，与已选 SpacetimeDB 比较，不表示迁移。

仍未形成具体方案的事项：

- 仓库已选 SpacetimeDB / React 并记录演示排期；仍需确认规模、模型预算、公开部署资源和目标终端的实际验证。
- 子仓库已有 Git 和分支协作约定，无需重新初始化；本次提案纳入 yq 个人分支；双方接受前保留 Proposed，不合入 main。
