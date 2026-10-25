# Handoff / 必要交接

- Diary now shows only records created strictly after its previous close, filtering before visit merging. Closing the town Diary advances all mirrors; closing a room Diary advances only that mirror. Cutoffs are identity-scoped browser storage, with session-memory fallback, frozen while open, and saved on unmount/pagehide (StrictMode replay excluded). First use shows existing records. The quiet dot follows the same cutoffs. 37 diary tests, 3 Home tests and production build passed; see [last-close validation](validation/2026-10-24-diary-comments.md#since-the-previous-close-2026-10-24).

- Status card history is explicitly scoped by the user's choice to their own mirrors' exchanges with the selected resident, matched by participant IDs. Guest/empty history must not substitute other public conversations. Current client defaults are 7 real days / 5 exchanges with extractive source highlights; see [implementation and validation](validation/2026-10-24-resident-status-card.md).

- Diary now shows a compact chat-only extract (up to two sentences / 50 words / 280 characters) per merged visit. Legacy filtering removes common English/Chinese simulation actions, scene clauses, stage directions and AI decisions; it remains heuristic. Name grouping, the 30-minute rule and interest/contact controls remain. Build, backend typecheck and 30 diary tests passed. The stricter generation prompt and non-narrative failure fallback remain unpublished. See [current behavior and limits](validation/2026-10-24-diary-comments.md#concise-chat-only-summary-2026-10-24).

- Local preview recovery: the user supplied frequent-converter-stockings-place.trycloudflare.com; ignored .env.local now uses its wss origin for mirrorville and the documented public auth client. Local guest map / 7 mirrors / Residents and the hosted login entry were checked; real sign-in and writes were not exercised. See [runtime validation](validation/2026-10-24-local-frontend-runtime.md).

- 当前检出个人分支 yq；本次从 origin/yw/map-assets（7509d4b）下载并合并应用代码，保留 Godot 工程、历史文档与个人 Proposed，不修改 main。
- 用户明确：ADR 是双方已经形成共识的确定文件；只有 Proposed 是最近在考虑的想法。汇报两者必须分开，未实现的 ADR 也不是新的 Proposed。
- 从 [PROGRESS](PROGRESS.md)、[团队原则](core/principles.md) 与 [决策索引](decisions/README.md) 开始；原对话背景在 [discussion-context](core/discussion-context.md)，不能据此覆盖共识。
- 团队原则与 ADR 0001–0008 保留 main 原文。Proposed 接受前不编号、不改为 Accepted，也不改变既定原则。
- 父目录整理已纳入本仓库 docs，相对代码路径以本仓库为根。父目录副本无自动同步；历史验证的旧目录与版本描述不代表本次状态。
- 当前合并代码已包含 0008 日记／兴趣／联系方式、SpacetimeAuth 登录及地图／Home 网页集成；本机检查与源机器验证分别记录。个人 Proposed 的状态不因代码合并自动改变。
- Activity Helper PRD 与赞助商资料保留独立参考副本；FigJam、赛事规则与外部 API 本次未重新核验。
- 分支交付范围和检查见 [验证记录](validation/2026-10-24-yq-branch.md)。未运行应用、调用模型或部署服务。

- Latest local update checks: [7509d4b merge](validation/2026-10-24-update-yw-map-assets.md). This operation updates files only; it does not publish the backend, run refresh_world_schedule, or activate/deactivate shared residents.

## Source branch operation handoff

以下保留队友分支交接内容；其中 Windows 数据路径、数据库和授权回调属于原开发机，不可直接当作本机配置。本次没有运行发布或迁移命令；检查见 [merge validation](validation/2026-10-24-merge-yw-map-assets.md)。

# Handoff

- **Combined branches (2026-10-25)**: local `yw/map-assets` integrates `origin/yq` at `d85c3ed`
  with source/desktop/iPhone/authentication/appearance work saved at `69ad3f8`. Full-screen room,
  contact-in-mirror, status cards, diary summaries/windowing, zoom and larger pins coexist with
  learning journeys, four-source intake, sharing and appearance changes. Recovery branch:
  `codex/pre-yq-merge-20261025`. See `validation/2026-10-25-yw-yq-merge.md` for conflict resolutions
  and checks. This source merge does not publish the server or push remote branches.

- **iPhone explicit sharing**: `mobileShare.ts` accepts validated standalone `#mirrorville-share=`
  base64url JSON or `#mirrorville-text=` URI-encoded Shortcuts text. `SessionRoot` retains a redacted
  memory draft, clears its own fragment after mount, and shows a nonblocking pending banner.
  Town -> Review shared item requires owner-mirror choice; new creation can review the waiting
  item on its source paper. References require an owner meaning note; quoted text stays local.
  Facts only, no voice, receipt is not event date. Email sign-in caches only a redacted draft in
  sessionStorage for fifteen minutes; discard/signout/success clears it. See
  `design/iphone-web-receiver.md` and `validation/iphone-web-receiver.md`. No device-install claim.

- **Four-source letters**: the physical desk's Bring a letter opens Observe my computer / GitHub /
  AI introduction / own update in one paper flow (`SourceOffering.tsx`). The independent Windows
  helper `python desktop/observer.py --origin http://localhost:5173` starts paused; use the actual
  configured browser origin. Pair, explicitly enable, then review live clues before cloud handoff.
  Browser page topics have a separate opt-in. Closing UI leaves enabled capture running; pause or
  quit helper to stop. Loopback stays private; no tunnel proxy. Legacy Marglo package is secondary.
  GitHub uses public API reads with no app/token setup; ownership is declared, not verified.
  Adapters use existing facts imports, so no backend publication is required. Photos/audio and
  automatic cloud sharing are not implemented. See `design/four-source-learning.md` and validation.

- **Facebook own-post import**: My words -> Bring Facebook posts now opens the configurable
  browser-only source. No App ID is configured yet, so it shows an honest unavailable state.
  Set public `VITE_FACEBOOK_APP_ID` (local build env / GitHub Actions repository variable), configure
  Meta Web Login and `user_posts` access, then test a real account before claiming connected.
  `VITE_FACEBOOK_GRAPH_VERSION` defaults to `v23.0`. No secret/token in Vite settings. No server
  migration, publication or auto-sync. Setup and limits: `design/facebook-import.md`; mock/live
  acceptance distinction: `validation/facebook-import.md`.

Things that are not obvious from the code.

- **Permanent hosting**: `.github/workflows/deploy-pages.yml` publishes `yw/map-assets`
  to `https://itismixian.github.io/cal-hack-proj/`, using Maincloud database
  `mirrorville-yw9299-world`. Redeploy the backend with explicit `--no-config --server
  maincloud --module-path spacetimedb --delete-data=never`; the auth project remains
  on `mirrorville-yw9299-hyy77`. Existing local residents/cards are not yet migrated.
  See `validation/maincloud-pages.md` for deployment checks and remaining validation.

- **Town timing/navigation**: movement timer is 200ms; social decisions stay at most once/second.
  `refresh_world_schedule` is admin-only and retimes existing databases without resetting data.
  Arrivals rest 90–180 real seconds. Shared town day lasts 45 real minutes; real dates still govern
  diaries/import recency/evidence caps. Rebuild navigation with `python scripts/build-town-navigation.py`
  after scene/art edits. Collision and fixed-speed route playback are client presentation; server
  social proximity retains abstract coordinates. See `validation/town-navigation-and-timing.md`.

- **Shared preview performance / login**: public `*.trycloudflare.com` requests now serve the
  production `dist/` build through `scripts/share-preview.ts`, gzip-compressed, with no dev module
  graph. Localhost keeps HMR. Run `npm.cmd run build` after changes to update the share URL.
  After restart, start the local database/dev server and create a new tunnel before sharing.
  The old tunnel URL is temporary. Town artwork uses WebP and explicit loading/retry (no old-map fallback).
  Login images have smaller WebP variants and the mobile form is in normal flow; originals remain.
  The current tunnel's exact login/logout callbacks were saved in SpacetimeAuth with owner approval;
  a replacement tunnel needs replacement exact entries. See `validation/mobile-login-and-share-performance.md`.

- **Room delivery**: `python scripts/optimize-room-assets.py` creates 347KB WebP delivery
  copies from 5.34MB original art. `roomArt.ts` shares preload/decode work and gates partial
  display; owned sessions preload after five seconds in town. Rebuild after changing assets.

- **Authored Mirror Room** (`yw/map-assets`): `origin/yq` commit `1f404a9` supplies `Home.tscn`
  and five PNGs. Regenerate with `node scripts/import-home-scene.mjs 1f404a9`. Keep generated
  `src/homeScene.json` in sync. All existing room actions remain connected; no data migration.
  Checks and remaining device validation are in `validation/authored-mirror-room.md`.

- **Authored town / camera** (`yw/map-assets`): imported `origin/yq`'s `329e7e8` scene;
  regenerate with `node scripts/import-town-scene.mjs 329e7e8`. The town fills the viewport,
  with General/Follow modes and owned-mirror selection. General defaults to viewport cover
  with touch/pointer drag; conversation text is kept in character panels, with tiny pixel
  indicators on the map. Arrived indoor mirrors render as clickable roof portrait pins
  (cafe/gym/restaurant/clock hall/farm); park remains outdoors. No database publication is needed.
  Existing server coordinates are projected onto forecourts; this does not add collision/pathfinding.
  See `validation/authored-town-and-camera.md`. For temporary HTTPS sharing, Vite proxies only
  the SDK subscribe and websocket-token routes; client connections use the share origin.
  Guest access and current temporary-domain callback registration are checked; full phone account
  magic-link completion remains Pending.

- **Original Windows data directory**: use explicit `--data-dir`
  `C:/Users/1/AppData/Local/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Local/SpacetimeDB/data`
  and `--jwt-pub-key-path` / `--jwt-priv-key-path` pointing to `id_ecdsa.pub` / `id_ecdsa`
  in its sibling `config/`. Plain `spacetime start` under Codex can open a different empty
  directory after restart. Do not republish to compensate for a missing database.
- **Run locally on other machines**: `spacetime start`, then `spacetime publish mirrorville --module-path spacetimedb --server local --yes`,
  `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`, `npm run dev`.
  After changing the module, publish and regenerate bindings.
- **Preserve data when publishing.** 0008 appends `contact` with a migration default and adds private
  tables; the local upgrade succeeded with `--delete-data=never`. Breaking schema changes may still
  require `--delete-data=always`, which clears everything, including model keys. Tell the owner before
  doing that; they need to run `npm.cmd run set-keys` afterwards.
- **Keys**: `npm run set-keys` prompts with hidden input (paste with right-click in Windows terminals;
  Ctrl+V may not paste in raw mode). It stores keys through the database's HTTP API using
  `SPACETIMEDB_ADMIN_TOKEN` from `.env.local`, which is the publisher identity's local token. Never commit
  `.env.local`.
- **On the original dev machine** the SpacetimeDB CLI was installed inside the coding agent's sandbox,
  so it is not on the real PATH. Anyone else should install the CLI normally (spacetimedb.com/install).
- **PowerShell** blocks `npm`/`npx` scripts on that machine; use `npm.cmd` / `npx.cmd`.
- **Resident exits**: five publisher-owned system demo mirrors (ids 1–5) are now inactive.
  No demos are automatically seeded. Admin `set_resident_active(id, active)` reversibly hides/restores
  a resident, ending active conversations on exit and retaining all data. Test mirrors remain pending
  owner clarification; mixian id9 remains active. Latest temporary public origin is
  `https://frequent-converter-stockings-place.trycloudflare.com`; exact auth callbacks saved.
- **Docs reader**: `python .agents/skills/orrery-docs-local/scripts/orrery_docs.py build --target .`, then open
  `docs/_site/orrery-docs.html` (generated, gitignored).

- **Login**: Continue with email opens the hosted page where email is entered once; no local
  email field or separate sign-up toggle. Guest entry shares the main signboard panel.
  The entry page uses the team's exported Figma assets. Accounts use SpacetimeAuth email
  magic links; guests keep their original local token. This machine's `.env.local` has the public
  `VITE_SPACETIMEAUTH_CLIENT_ID`. For setup, exact callbacks, cloud ownership and limitations see
  `design/login-and-auth.md`; acceptance is in `validation/login-figma-and-auth.md`. No client secret
  goes in the browser. Guest-to-account transfer is now implemented using a short-lived capability
  prepared with the saved browser guest token; see `validation/guest-account-transfer.md`. Menu has
  `Sign in & keep my mirror`; account entry with a saved guest credential claims before town opens.
  Residents shows IDs and owner-only Move out / Bring back. Existing same-name residents are not
  automatically merged; real email transfer acceptance remains pending.
  Account-based cleanup kept `Yiqiao Liu #12` and `mixian #9` active after checking the provider's
  user identities. Guest/test residents #6–8, #10–11, #13–15 were reversibly moved out; all rows remain.

- **Fidelity A/B** (`yw/fidelity`): imports now require `latestAt` (empty string for unknown), merge a
  complete card set and update the private summary. Regenerate client bindings after publication.
  Local migration is additive and used `--delete-data=never`. Test mirrors are 10/11; do not use
  mixian id 9 for QA. Counts, Pending subjective acceptance and the delayed main rebase are in
  `validation/mirror-fidelity-a-b.md`. No Part C or 0004 changes.

- **Import-first onboarding / voice**: new clients call `createMirrorOnboarding`; the old creation
  reducer stays compatible. `importWriting.inputKind` distinguishes AI summaries, own messages,
  AI chats and unclassified facts. Only own messages of at least 120 characters infer style (shorter
  daily answers still merge facts). Two new owner-only views are `my_learning` and `my_style`.
  Copy/paste permission failures have manual fallbacks. Owner style corrections and marked examples
  survive later imports. Today's room question and optional conversation topic follow venue dates,
  not town days. Local migration is additive, with `--delete-data=never`; regenerate bindings after
  backend changes. See `validation/import-onboarding-and-voice.md` for tests and Pending owner QA.

- **Scene-first meeting revision**: current creation UI lives in `CreateMirror.tsx` plus
  `first-meeting.css`. Keep it one visual room: anchored reflection speech, letters and responses;
  do not restore an illustration/form split. `WordOffering.tsx` is shared with `WritingDesk.tsx`.
  `MirrorExchanges.tsx` handles one-card/one-line exchanges. `createMirrorOnboarding` accepts an
  empty words list with no import: this is an honest thin mirror, neutral extraversion, no invented
  biography. No schema change/reset is required for this revision. See
  `validation/interactive-first-meeting.md` and `design/first-meeting.md`.

- **Adopted character wardrobe**: the owner approved four simple color-block designs. `look` 1–4 now map to Rust/Sage/Honey/Coral; 0 and legacy 5–7 keep the original. `CharacterSprite` is shared by portraits, room actors and town. Creation selection is locked once saved. Run `node scripts/build-character-atlases.mjs` with `pngjs` available to rebuild the 34KB atlases from `art/characters/`. No backend/schema/bindings publication is needed. See `validation/character-wardrobe.md` for browser evidence and unverified public/device checks.

- **Room actions / real voice rehearsal**: desk/mirror entrances now use `RoomJourney.tsx` and
  `roomJourneyMath.ts` for floor routes, actor facing/walking frames, camera and arrival-gated
  material interaction. Keep foot anchors when changing character scale. Name is on a tag;
  writing is on desk paper. New mirrors are temporarily inactive until the door (or Close) releases
  them. If a page refresh interrupts this, Residents -> Bring back restores the saved mirror.
  `tryMirrorVoice` is an owner-authenticated procedure returning a live contextual reply;
  `correctVoiceTrial` saves only an explicitly confirmed, redacted owner-authored wording example.
  Both use existing private style storage; regenerate bindings, publish with `--delete-data=never`.
  Current evidence: `validation/room-actions-and-rehearsal.md`.

- **Character full-walk follow-up**: foot-only animation is replaced by distinct full-body stride poses in `art/characters/walk/`. The builder locks approved heads and idle frames. `characterAnimation.ts` supplies original 5fps `[0,1,2,1]` cadence to room and town; movement speed is unchanged. The runtime-atlas comparison GIF and checks are in `validation/character-wardrobe.md`.

- **Character release live**: `15e9756` deployed successfully via Actions `40169358901` to the existing Pages URL. Production retains its earlier creation/account/backend flows, with five real character choices and full town animation. Local room-journey/voice/import work was deliberately excluded. Hosted assets hash-match the release. See `validation/character-release.md`. Remaining uncommitted work is preserved against this new release base.
