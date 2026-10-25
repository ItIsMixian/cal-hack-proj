# Merged project structure

Latest 2026-10-25 entry: App initializes roomOpen=true and journeyOpen=false.
MirrorRoom supports an authored no-mirror/loading room with an in-room CreateMirror
entry; the selected owned mirror is used once subscribed. Go to town opens the journey;
invitations are deferred until that departure. This supersedes initial static selection.
[Checks](../validation/2026-10-25-room-first-entry.md).

Latest 2026-10-25 animation scope: App.tsx enables WorldJourney's animated mode only
from MirrorRoom.onBack. Initial/menu selectors render without a canvas/scene; map
WorldNavigator arrows use changeMapWorld directly and retain transactional enterWorld
for existing slots. This supersedes the earlier login/map-arrow animation behavior.
[Checks](../validation/2026-10-25-room-only-departure.md).

Latest 2026-10-25 public discovery: App.tsx opens a separate PublicTowns.tsx view;
the component subscribes to discoverable_worlds only while mounted. The sender-scoped
view filters membership, allowStrangers and member capacity, exposing only id/name/
description/maxMembers/memberCount. Existing joinOpenWorld enforces admission and
creates a world-local mirror before committed selection permits departure. All joined
world slots now appear by name in the main list, including the default lobby.
[Actual checks](../validation/2026-10-25-public-town-discovery.md).

Latest 2026-10-25 journey integration: App.tsx gates world entry behind WorldJourney.tsx,
with the handed-off route/art drawn by DepartureScene.ts and world-journey.css. Actual
world slots, invitations and creation call existing reducers; committed selection gates
visual departure. The standalone prototypes/departure/ remains unchanged, with runtime
assets under public/assets/departure/. No other yw/map-assets work was imported.
[Checks](../validation/2026-10-25-departure-integration.md).

Latest 2026-10-25 addition: private mirror_prototype records hold identity-level starting
name/look/selfCard/extraversion/intent. getMirrorPrototype lazily backfills existing users;
activateWorld ensures one independent owned resident before switching the view. Creating,
invitation joining and open joining share this path. No world history/contact/card copying.
[Evidence and limits](../validation/2026-10-25-auto-world-mirrors.md).

Current local test runtime (2026-10-25): `spacetimedb/src/index.ts` now has private worlds,
memberships/selections, invite/update/join/enter reducers and member-scoped mirror/conversation/
line views. Mirrors and personal profiles belong to their creation world; switching only changes views.
World-local simulation clocks/randomness/quotas keep all worlds running without viewers.
Cards, imports, contacts, diaries and relation memories stay world-scoped. `scripts/start-local-worlds.ps1` deploys the isolated local
database on port 3010; `App.tsx` uses the generated world API in default worldtest mode.
Original .env.local/shared data remain unchanged. Earlier browser-only slot storage is not
imported. [Runtime and limits](../design/local-world-test-environment.md),
[initial checks](../validation/2026-10-25-local-world-backend.md),
[independent-mirror fix](../validation/2026-10-25-independent-world-mirrors.md).

Latest 2026-10-25 empty-slot UI: `EmptyWorld.tsx` / `empty-world.css` present invitation
input and a create-world entry on the dark background. `WorldSettings.tsx` also supports
creation; `WorldPreview.ts` restores valid extra-slot settings as device-local worlds.
Those worlds use the authored map with no residents and no shared Diary/Residents/mirror
creation access. Slot 1 alone receives live resident presentation. Browser-local world
creation is implemented; server creation/invitation joining is not. [Checks](../validation/2026-10-25-empty-world-entry.md).

Local 2026-10-25 owner-settings preview: `WorldSettings.tsx` supplies the editable
name/introduction, strangers switch and maximum-people form; `WorldPreview.ts` validates
and stores preview settings in browser storage per world ID. `App.tsx` has a Preview as
role selector and conditionally shows Edit world for existing worlds in owner view.
`WorldNavigator.tsx` receives the saved display name. This has no real owner identity,
server persistence or admission/capacity enforcement. [Checks](../validation/2026-10-25-world-settings.md).

Local 2026-10-25 addition: `src/WorldNavigator.tsx` provides a five-slot, wrapping world
selector using the user's unchanged `public/assets/ui/world-nameplate.png`. `App.tsx`
renders the live shared town only for slot 1; uncreated slots unmount the canvas and show a
solid dark-gray background plus the entry window. Slots 2–5 can now hold local preview maps;
Diary, Residents and mirror creation stay disabled outside slot 1. Mirror Room
remains enabled for an available owned mirror in every slot and opens the same personal
room, preserving the selected slot on return. No backend world model
or isolation has been added. See [validation](../validation/2026-10-25-world-navigation.md).

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
| `src/CharacterAvatar.tsx` | Shared idle character preview for Mirror Room and creation form |
| `public/assets/characters/` | Original Cup Nooble PNG from teammate branch, source mapping and license |
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

## Known gaps

- Only the venue room is live; teammates and old-friends rooms are visibility settings only.
- No triadic referral, group conversations, or Messenger/36-questions import.
- Simulation not deployed publicly; an empty Maincloud database anchors SpacetimeAuth only. Town runs on the dev machine (see HANDOFF; plan in decision 0007).
- The contact column uses an appended migration default; new diary/interest tables are additive. Destructive publication still wipes keys and must be announced first.
