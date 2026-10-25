# Merged project structure

Updated 2026-10-24. Latest source: `yw/map-assets` at `7509d4ba95dd383d6b0befee23c84d6246383b69`; local target: `yq`, previously `7c7f5e6`. This records downloaded code. Current local checks are in [update validation](../validation/2026-10-24-update-yw-map-assets.md); earlier merge evidence remains in [merge validation](../validation/2026-10-24-merge-yw-map-assets.md).

## Authored project retained on yq

- [mirrorvile/project.godot](../../mirrorvile/project.godot) is the original Godot 4.5 / Forward Plus project with Player1, Player2, Town map and Home scenes and their original assets.
- [Town map](../../mirrorvile/Town%20map.tscn) includes House / Decoration tile layers; [Home](../../mirrorvile/Home.tscn) contains Bookshelf, Mirror, Diary and Carddesk sprites. The teammate converted these scenes for the web client; the original Godot project is preserved.
- The earlier yq state and progress documents are preserved in [historical source text](../library/history/2026-10-24-before-code-merge.md). Their statements about missing diary/login implementations are superseded by the downloaded code below.
- [Activity Helper](../library/originals/idea1_PRD_v0.1.md) remains an independent idea. [Discussion context](../core/discussion-context.md) and the seven personal Proposed ideas are retained; merging code does not accept them or change team principles.

## Teammate's implementation inventory

Local Diary read-window addition: `src/DiaryHistory.ts` stores close cutoffs per identity,
with a town-wide timestamp and per-mirror timestamps. `src/useDiaryWindow.ts` snapshots
the cutoff while open and saves on real unmount/pagehide, ignoring StrictMode replay.
`Diary.tsx` excludes records at or before the applicable cutoff before grouping/summary;
`App.tsx` uses the same boundaries for its quiet new-content dot. `MirrorRoom.tsx` no longer
marks all diaries seen when one mirror's Diary opens. First use includes existing notes;
no server schema or stored diary rows change. See [validation and limits](../validation/2026-10-24-diary-comments.md#since-the-previous-close-2026-10-24).

Local Status card addition on `yq`: `src/ResidentStatusCard.tsx`, `src/ResidentConversations.ts` and `src/resident-status-card.css` replace the selected-resident raw conversation view through `App.tsx`. Cards show activity/location and recent owner-pair source-content highlights, matching exact participant IDs. No schema or model generation changes are needed; see [current validation](../validation/2026-10-24-resident-status-card.md).

Local Diary addition on `yq`: `src/Diary.tsx`, `src/DiaryReview.ts` and `src/diary.css` render a concise chat summary with time/place metadata and preserved interest/contact controls. `diaryTopics`/`sessionTopics` filter and deduplicate legacy content; `sessionSummary` selects at most two sentences, bounded by 50 words and 280 characters. Common scene actions, stage directions and AI decisions are filtered by English/Chinese heuristics. `spacetimedb/src/index.ts` requests only spoken content in 1–2 sentences (40 words / 100 Chinese characters), with a summary-unavailable fallback on failure; these backend changes remain unpublished. See [current local validation and limits](../validation/2026-10-24-diary-comments.md#concise-chat-only-summary-2026-10-24).

The Diary UI now groups those comments by `otherName` from the current view, retaining
all conversations under a single displayed-name heading. Groups and their notes are ordered
by recency; see [current grouping and API boundary](../validation/2026-10-24-diary-comments.md#grouping-by-person-2026-10-24).

`src/DiarySessions.ts` now groups nearby same-venue exchanges into bounded 30-minute visits
per own mirror/displayed person. Diary renders one comment per visit, retaining source rows
and their interest/contact reducer IDs. See [current merging checks](../validation/2026-10-24-diary-comments.md#nearby-exchanges-in-one-comment-2026-10-24).

Local room layout addition on `yq`: `App.tsx`, `MirrorRoom.tsx`, `PixelRoom.tsx` and `pixel-room.css` provide a full-viewport room with proportional cover scaling, bounded panning and clickable furniture. The summary disclosure, privacy label and bottom shortcut buttons have been removed. [Current local validation](../validation/authored-mirror-room.md#simplified-room-controls-2026-10-24) is separate from the source-branch inventory below.

The mirror panel now includes the existing contact editor; the independent Address book hotspot and `contacts` room-object route are removed. Four furniture routes remain. See [mirror/contact validation](../validation/authored-mirror-room.md#contact-editing-merged-into-the-mirror-2026-10-24).

Local addition on `yq`: `src/TownCamera.ts` and `src/WorldCanvas.tsx` now provide cursor-anchored General wheel zoom with viewport-cover scale and position bounds. Build, 14 scene/camera tests and desktop/portrait browser checks passed; see [zoom validation](../validation/2026-10-24-general-wheel-zoom.md).

The following source text is retained from `yw/map-assets:docs/state/project-structure.md`. Its implementation and validation descriptions refer to the source branch's evidence; they are not a substitute for the local merge checks.

# Project structure

Facebook own-post source: `src/facebook.ts` and `src/FacebookOffering.tsx`, reached through the
shared `WordOffering.tsx` own-writing desk. Local preview/edit/redaction uses the existing facts
import pipeline; no server schema change. Requires a configured Meta app and `user_posts` access;
live Facebook authorization is not yet verified. See `design/facebook-import.md` and
`validation/facebook-import.md`. No background sync or friends' feed import.

As of the diary and Figma login implementations on `yw/diary` (2026-10-24). Facts from the code; validation is recorded separately.

## Layout

| Path | What it is |
| --- | --- |
| `spacetimedb/src/index.ts` | The whole backend module: tables, tick, conversations, diaries, interest, contacts, Mirror Room, views, admin |
| `spacetimedb/src/world.ts` | Town layout (6 places), intent → place keywords, activities, daily events and shared accelerated town clock (45 real minutes/day) |
| `spacetimedb/src/tipi.ts` | TIPI questionnaire, scoring, self-card sentence |
| `spacetimedb/src/redact.ts` | Redaction, facets, rooms, default visibility (`isVisibleIn`) |
| `spacetimedb/src/fidelity.ts` | Full-collection merge planning, two-card facet slots, protected edits, AI/date guards and owner pronoun display |
| `spacetimedb/src/llm.ts` | Raw HTTP calls: DeepSeek chat, Claude Messages, JSON parsing |
| `src/SessionRoot.tsx` | Entry gate, SpacetimeAuth OIDC sessions, separate guest credential and database connection |
| `src/LoginScreen.tsx`, `src/login.css` | Figma pixel-art entry screen, email hint, hosted account login/signup and guest entry |
| `public/assets/login/` | Original Figma image layers plus compressed desktop/mobile WebP delivery variants |
| `scripts/optimize-login-assets.py`, `src/pixel-font.css` | Reproducible delivery variants and embedded WOFF2 font (originals/licenses retained) |
| `scripts/share-preview.ts` | Gzipped production build for temporary share domains; localhost keeps Vite HMR |
| `public/fonts/` | Locally hosted Pixelify Sans and OFL license |
| `src/App.tsx`, `src/town-game.css` | Game town shell: clock, live map, action dock, resident/guide panels, diary overlay and Mirror Room entry |
| `src/WorldCanvas.tsx`, `src/TownCamera.ts` | Full-viewport Canvas with General/Follow cameras, owned-mirror selection, walking sprites, inverse-camera picking and screen-sized speech bubbles |
| `src/AuthoredTown.ts`, `public/assets/town/` | Teammate's complete Godot town layout (11 sprite instances, 220 House/Decoration cells), original textures/provenance, client-only forecourt projection |
| `scripts/import-town-scene.mjs`, `scripts/test-town-scene.mjs` | Reproducible scene conversion and layout/hash/projection/camera checks |
| `src/TownBuildings.ts`, `src/TownNavigation.ts`, `src/townNavigation.json` | Indoor portrait pins, weighted obstacle-aware paths and fixed-speed route playback |
| `src/CharacterAvatar.tsx`, `src/CharacterSprite.tsx`, `src/characterSprites.ts` | Shared character portraits and directional atlas loading for rooms and town |
| `src/CharacterPicker.tsx`, `src/character-picker.css` | In-room original plus four approved appearances, native radio selection, loading/retry and mobile scrolling |
| `public/assets/characters/`, `art/characters/`, `scripts/build-character-atlases.mjs` | Original Cup Nooble sheet/license, four delivery atlases, adopted source art/provenance and reproducible atlas preparation |
| `src/CreateMirror.tsx` | Make-a-mirror form (name, color, TIPI, optional on-mind and intent; blank intent starts in Park then explores occupied places) |
| `src/MirrorRoom.tsx` | Pixel room with private summary, per-mirror diary, two-card facet defaults, explicit share-state chips, inferred import scenes, notes and contact |
| `src/PixelRoom.tsx`, `src/pixel-room.css`, `src/homeScene.json` | Responsive interactive room with teammate-authored Home layout, keyboard-accessible furniture hotspots and existing game panels |
| `public/assets/home/`, `scripts/import-home-scene.mjs` | Five original room PNGs and authored Home.tscn transforms/provenance; reproducible conversion |
| `src/RoomDialog.tsx` | Native modal game panel with focus containment, Escape and focus return |
| `src/Diary.tsx` | Paginated game journal with venue dates, optional mirror filter, visible interest and mutually unlocked contacts |
| `src/importers.ts` | Browser-only CSV/WhatsApp own-lines extraction with latest kept-message dates, source headers and equal per-file import budgets |
| `src/module_bindings/` | Generated by `spacetime generate`; do not edit |
| `scripts/set-keys.mjs` | Stores model keys (hidden prompt, HTTP with admin token) |
| `.agents/skills/orrery-docs-local/` | This documentation system's skill and reader builder |

## Backend tables

Public: `mirror`, `conversation`, `line`. Private: `config` (keys, admin), `mirror_profile` (owner,
self-card, contact), `relation` (pair sightings/talks/notes), `diary_entry`, `interest`,
legacy `encounter` and `human_message` (retained for migration safety; unused by the client),
`mirror_card`, `mirror_summary`, `import_status`, `mirror_rest` (90–180 second stays),
`world_runtime` (5Hz movement / at most 1Hz social gate), plus scheduled `tick_timer`, `llm_job`, `import_job` (with migration-default latest-message ISO date).
Per-visitor views: `my_mirrors`, `my_diary`, `my_cards`, `my_summaries`, `my_imports`. The postcard/chat views and reducers have been removed.

## Implemented

- No automatic demo residents on init/reset. Existing residents can reversibly exit through admin-only `set_resident_active`; inactive rows retain profiles/cards but leave simulation and the visible roster. Visitors create up to 3 mirrors each, 60 active total.
- Daily rhythm, visible activities, extraversion-weighted initiative, relationship sightings/talks,
  conversation length by familiarity, natural endings (`[END]`).
- Diaries for both sides of each wrapped conversation, including non-matches; model failure uses a factual fallback.
- Good-fit marks preserve 0004 evidence checks, allowed reasons, repeat-talk requirement, pair deduplication and daily cap.
- Visible directional interest; demo mirrors reciprocate. Contact details remain private until mutual interest, and can be edited or cleared in the Mirror Room (120 characters).
- Legacy postcards still count toward pair/daily limits after a data-preserving upgrade.
- Mirror Room per 0005; only venue-visible cards reach prompts.

- Figma entry screen with guest entry/exit and real SpacetimeAuth integration. Authentication configuration and checked/Pending flows are in `validation/login-figma-and-auth.md`.
- Guest-to-account transfer preserves captured mirror IDs and private data using a private,
  expiring `guest_transfer` capability. `src/guestTransfer.ts` prepares it with the saved guest
  token; account entry claims it before rendering town. Owners can move out/restore mirrors via
  Residents and `my_archived_mirrors`; duplicate owned names are rejected on creation. See
  `validation/guest-account-transfer.md` for verified checks and pending real email acceptance.

## Known gaps

- Only the venue room is live; teammates and old-friends rooms are visibility settings only.
- No triadic referral, group conversations, or Messenger/36-questions import.
- Simulation not deployed publicly; an empty Maincloud database anchors SpacetimeAuth only. Town runs on the dev machine (see HANDOFF; plan in decision 0007).
- The contact column uses an appended migration default; new diary/interest tables are additive. Destructive publication still wipes keys and must be announced first.

## Import-first onboarding and voice (2026-10-24)

- `src/onboarding.ts` holds the copyable AI-summary prompt. `CreateMirror.tsx` prepares a locally
  redacted import or uses a three-word fallback. `MirrorRoom.tsx` reuses its importer and renders
  fact confirmation, optional TIPI refinement, the daily question, today's topic, and style choices.
- `spacetimedb/src/learning.ts` supplies allowed starter descriptions, venue-date handling, bounded
  preservation of style votes, source-sentence checks, and delivery-only line-writing instructions.
- New private tables: `mirror_learning` (starter words, fact confirmation, daily progress and topic),
  `mirror_style` (description, generated examples and owner choices). Owner-filtered views:
  `my_learning`, `my_style`. `import_job.input_kind` is appended with migration default `facts`.
- `scripts/test-learning.mjs` executes actual server callbacks for ownership, provenance, daily
  boundaries, model/stale replacement failures, and style protection. Browser/synthetic results and
  human-only acceptance gaps are recorded in `validation/import-onboarding-and-voice.md`.

## Scene-first meeting revision (2026-10-24)

Creation now uses a single continuous room, `CreateMirror.tsx` / `first-meeting.css`, with the current
line anchored to the reflection. `PixelRoom.tsx` has a welcome presentation with only relevant scene
interactions; `RoomDialog.tsx` supports the full-scene encounter while retaining normal room panels.
`WordOffering.tsx` replaces the long importer in the primary creation/desk paths and preserves local
filtering, explicit provenance and redaction. `WritingDesk.tsx` follows actual import status.
`MirrorExchanges.tsx` presents one factual card, voice line, daily question, or optional personality
question at a time. Detailed card controls remain behind an explicit disclosure. Legacy importer
regression coverage remains; it is not the primary UI.

A name-only walk is supported without invented starter traits; the three-word API remains compatible.
Current visual and interaction evidence: `validation/interactive-first-meeting.md`.

## Room actions / contextual rehearsal (2026-10-24)

- `RoomJourney.tsx`, `roomJourneyMath.ts`, `room-journey.css`: actual floor travel, direction and
  animated atlas frames, scene camera, arrival-gated stationery, desk paper and mirror surface.
  Existing shared `CharacterSprite` rendering remains integrated. Characters are enlarged in the
  journey and regular `pixel-room.css`, with feet and labels repositioned together.
- `CreateMirror.tsx`: name tag, desk, real import status, mirror and door sequence; also accepts an
  existing owned mirror when entered from `MirrorRoom.tsx`. New mirrors are temporarily inactive
  while in the lesson, then activated at the doorway; a refresh can recover them via Residents.
- `VoiceRehearsal.tsx`: live contextual model reply, approval, deliberate owner wording correction,
  and another situation. `tryMirrorVoice` is a procedure; `correctVoiceTrial` is an owner-only reducer.
  They reuse private `mirror_style` JSON examples, with optional prompt/ownerWritten provenance;
  the original generated examples remain compatible. No new table/schema migration.
- Current validation and animated movement evidence: `validation/room-actions-and-rehearsal.md`.

## Four-source letters (2026-10-24)

- `SourceOffering.tsx` is the shared paper chooser in creation/existing-room journeys and legacy
  `WritingDesk.tsx`: direct desktop observation, GitHub, AI introduction and own update. `WordOffering.tsx`
  retains AI/manual drafts and existing writing/chat parsing; Facebook and old Marglo packages are secondary.
- `desktopObserver.ts` / `DesktopObservationOffering.tsx` pair with `desktop/observer.py`, an
  independent paused-by-default Windows collector, through the fixed authenticated loopback bridge.
  The UI controls capture, separately opts into browser topics, polls local clues, and requires
  owner review before cloud handoff. Closing the UI stops polling but does not pause opted-in capture.
- `margloPackage.ts` / `MargloOffering.tsx` validate versioned local packages and require reviewed
  pieces. `scripts/export-marglo-package.py` reads the source database without migration/writes and
  generates metadata aggregates; explicit context opt-in remains undated/tentative.
- `github.ts` / `GitHubOffering.tsx` read bounded public account project/activity data after an
  ownership declaration, then editable/selectable local review. No OAuth/app setup or token store.
- Both adapters use existing facts imports, preserve individual dates/source headers, and do not
  infer speaking style. No schema, generated binding or backend publication changes.
- Current limits: explicit reviewed cloud imports; supported text/chat files only in own-update
  route; no photo understanding, audio transcription, portfolio-site crawler or automatic sharing.
  Evidence: `validation/four-source-learning.md`.

## iPhone explicit text/link receiver

- `mobileShare.ts`: bounded UTF-8 rich-fragment/Shortcuts parser, local redaction, own-fragment
  consumption preserving auth parameters, and fifteen-minute redacted same-tab sign-in cache.
- `SessionRoot.tsx`: pure StrictMode-safe draft initialization, after-mount URL cleanup, pending
  banner, auth redirect continuity and discard/sign-out cleanup.
- `MobileShareReview.tsx`: explicit owner-mirror choice and editable own/reference review.
  External reference text stays local; only an owner meaning note goes through existing facts
  import. `App.tsx` offers nonblocking review/create; `SourceOffering.tsx` exposes the waiting item
  on the new-mirror desk. `mobile-share.css` styles the receiver without replacing the town.
- No backend/schema/bindings change. Native install/actual phone acceptance remains Pending;
  photo/audio capture and background phone surveillance are not implemented.
  Evidence: `validation/iphone-web-receiver.md`.
