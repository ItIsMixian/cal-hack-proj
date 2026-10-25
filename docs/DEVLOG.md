# Devlog

Complete deliveries and important changes only.

## 2026-10-24

- Rewrote the project from scratch on SpacetimeDB (0001): town, mirrors, conversations, encounters,
  private chat, TIPI self-card.
- Mirror Room v1: WhatsApp/paste import with in-browser redaction, facet cards, rewrite/undo.
- Lifelike town and postcards (0003, 0004, 0005): daily rhythm, activities, extraversion, relationships,
  grounded conversations, evidence-checked postcards with waves; Mirror Room as a page with per-room defaults.
- Adopted the simplified Orrery documentation system (`docs/`, `.agents/skills/orrery-docs-local/`).

- Implemented 0008 on `yw/diary`: conversation diaries, visible interest, mutual contact unlock and
  Mirror Room contact editing; additive local migration preserved model keys. Legacy postcard/chat
  tables retained for migration safety, their API removed. Acceptance and Pending items are in
  `validation/0008-diary-and-mutual-interest.md`.

- Added the team's pixel-art Figma login entry using exported source layers and a locally hosted font;
  integrated SpacetimeAuth account sessions alongside preserved browser guests. An empty Maincloud
  database hosts auth configuration; the simulation remains local. See `validation/login-figma-and-auth.md`.

- Reused the teammate's existing Cup Nooble character sheet for four-direction walking/idle mirrors;
  updated Mirror Room/creation previews, sprite hit areas, depth and bubble spacing. Source attribution
  and license retained; checks and Pending items are in `validation/character-sprites.md`.
# Optional intent — 2026-10-24

Made intent optional in the creation form and create/update reducers, retaining the length limit and existing Park default. Local module updated without deleting data. Checks: `validation/optional-intent.md`.
# Pixel room, town and journal — 2026-10-24

Turned Mirror Room into a clickable pixel interior, then matched the town with furnished venues and a game action dock. Diary now opens as a paginated paper journal in game panels, including a mirror-specific room entrance. Existing import, card, contact and interest handlers retained. Evidence: `validation/pixel-room.md` and `validation/pixel-town-and-diary.md`.

## Intent-free roaming — 2026-10-24

Fixed blank-intent mirrors inheriting a persistent Park preference. They now explore occupied places after lingering, while explicit intents and event attraction retain their behavior. Six selector tests and ten diary tests pass; local update preserved data. Live mixian observed walking toward Café. Evidence: `validation/intent-free-roaming.md`.

## WeChat CSV — 2026-10-24

Added browser-only PyWxDump CSV imports at the writing desk: retain sent plain text, omit received/quoted/forwarded/media records and export metadata, redact then preview, and combine multiple CSVs. Malformed CSVs cannot fall back to raw upload. Actual local exports retained 87 and 4 text messages; ten parser/UI callback tests and production build passed. No personal exports committed or submitted to the model. See `validation/wechat-csv-import.md`.

## Mirror fidelity A/B — 2026-10-24

On `yw/fidelity`, replaced append-only imports with complete per-facet merges, protected owner edits, previous-text undo, explicit AI scenes and dated Recent guards. Added owner summaries, source inference and clear sharing chips. Regenerated the owner's external AI scene files and dated the WeChat export; validated live imports on isolated mirrors 10/11 without changing mixian's cards. Additive local publication preserved data. Validation and Pending human/rebase acceptance: `validation/mirror-fidelity-a-b.md`.

## Authored town and Home scenes — 2026-10-24

On `yw/map-assets`, imported the teammate's complete town (`329e7e8`) and Home (`1f404a9`)
compositions with original PNGs, transforms, tile layers and provenance. Added a full-screen
General/Follow town camera and connected the room furniture to existing panels. A temporary
HTTPS preview supports guest access when venue Wi-Fi blocks direct LAN access. Production
build and 55 regression/scene tests pass; desktop/portrait interactions were checked. No database
publish/reset or mixian edits. Evidence and Pending device checks: `validation/authored-town-and-camera.md`
and `validation/authored-mirror-room.md`.

## Phone login and temporary sharing — 2026-10-24

Fixed phone entry clipping and removed the second input-frame appearance. Original PNGs remain;
phone artwork now totals about 121KB, with inline WOFF2 and gzip production delivery on share URLs.
Retained localhost HMR. Saved exact share-domain auth callbacks after owner confirmation and verified
the hosted email-login page opens. Build and 59 tests pass; actual phone speed and complete email
magic-link return still need owner validation. See `validation/mobile-login-and-share-performance.md`.

## Teammate login/map fixes integrated — 2026-10-24

Integrated yq commit 7c7f5e6: retain literal commas in town asset URLs for Vite static
serving, use literal filesystem paths in the corresponding regression, lower the desktop
email field/guidance and show focus on the existing artwork frame. Teammate device evidence
is retained under validation/2026-10-24-*. Current branch timing/navigation/room delivery
and data-preserving exit behavior remain in place. Email login_hint duplication investigation
is recorded but authentication behavior was not changed by this integration.

## 2026-10-24 — Selectable characters and frame animation

Owner-authorized frontend publication adds four adopted looks beside the original, visual selection in the current online creation form, consistent room/roster portraits and town rendering, and original-cadence full-body walk poses. No backend or account-flow changes. Production build and 82 tests pass. See `validation/character-release.md`.

## Existing-mirror appearance editor

Added owner-only persistent appearance changes from Mirror Room, with preview/cancel/save and error retry. Production package passes 88 tests and live Maincloud save/reconnect/other-owner denial checks. No table migration or data clearing. See validation/appearance-change.md.
