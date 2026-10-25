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

## 2026-10-24 — Import-first onboarding and voice calibration

Implemented Ask your AI / own-writing creation with a three-word fallback, reusable redacted
preparation, in-room fact confirmation and optional TIPI refinement. Added dated daily questions,
today-only topics, private style descriptions and five generated examples with protected owner
feedback. AI summaries never train voice. Server checks reject copied source sentences and malformed
style output before replacement; line writing consumes only its own style and current topic.
Published additive local migrations with data preservation. Full suite: 93 tests; desktop/mobile
browser checks and real synthetic imports passed. Owner voice acceptance and timed external-assistant
phone onboarding remain Pending. See `validation/import-onboarding-and-voice.md`.

## 2026-10-24 — Meet and teach the reflection in its room

Replaced form-like onboarding with a continuous-room encounter: the reflection speaks in an anchored
bubble, materials are handed over as letters, and the user responds to the current turn. Name-only
entry can go straight to town. Fact checking, voice rehearsal, daily questions and optional checks
now proceed one item at a time. Local import/privacy contracts remain; concurrent wardrobe work is
retained. Validation: `validation/interactive-first-meeting.md`.

## 2026-10-24 — Adopted selectable characters

Integrated the owner's approved v8 designs as four selectable looks alongside the original. Added shared portrait/room/town atlas rendering, generated side/back reference poses, prepared 32KB runtime atlases and a small foot-step cycle. Character choice is previewed in the room, supports native radio keys/mobile scrolling and locks after saving. Build and nine targeted tests pass; desktop/mobile room, all facing views and synthetic town picking were checked in the browser. Details and remaining checks: `validation/character-wardrobe.md`.

## 2026-10-24 — Act at the desk, rehearse at the mirror

Implemented grounded character walking and camera follow between desk, mirror and door, with larger
room characters. Name-tag and desk-paper inputs replace floor form controls. Actual import status
controls reading and the next journey. Mirror rehearsal now generates contextual replies, allows
explicit private owner-authored corrections and uses them in later attempts. New mirrors remain
away from town until the door; existing room tools use the same journey. No schema reset.
Evidence and remaining voice acceptance: `validation/room-actions-and-rehearsal.md`.

## 2026-10-24 — Full character walk poses

Replaced the provisional foot-only step with new per-direction stride body/limb poses for all four adopted characters. Original animation atlas supplies the motion reference. Approved heads and idle frames remain pixel-identical, with a one-pixel head bob during strides. Room and town now use shared original 5fps cadence. Build, eleven targeted tests and 48-frame pixel verification pass; actual-atlas animation GIF and browser evidence are recorded in `validation/character-wardrobe.md`.

### Character frontend deployment completed

Published `15e9756` to `yw/map-assets`; Actions `40169358901` build/deploy succeeded. Release package passed 82 tests. Hosted HTML/PNG hashes and browser guest/character-preview checks passed. Kept existing production creation/account/backend behavior; local learning/room/transfer/Facebook work remains uncommitted and outside this release. See `validation/character-release.md`.
