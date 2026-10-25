
# Handoff / 必要交接

Latest: Anthropic key configured in the active Maincloud database; direct Claude Opus 5.5 request passed. End-to-end cloud import/diary verification remains Pending. [Evidence](validation/2026-10-25-anthropic-config.md).

Latest: temporary guest residency and a host-controlled Demo OFF/ON switch are implemented. Protected mixian #9 retained; duplicate #18 retired. [Checks](validation/2026-10-25-guests-and-demo-toggle.md).

Latest integration (2026-10-25): yw web/desktop + yq independent worlds and room-first entry are combined. Maincloud migration preserves the original local database and resident ID 9. See [integration checks](./validation/2026-10-25-integrated-cloud-demo.md) for deployment state and Pending checks.


- Empty-world entry now also has Find a public town / Explore public towns. Both map
  and journey entry forms open the existing PublicTowns list, now searchable by name
  or introduction. Back returns to the originating form/slot with invitation text
  preserved; map-origin discovery stays unanimated. [Checks](validation/2026-10-25-empty-world-public-search.md).

- Latest entry rule: login/App mount and refresh start in Mirror Room, not the town
  selector. Owned current-world mirrors open their room; no-mirror users see the same
  authored room with Make your mirror, and creation/cancellation stays inside it.
  Go to town starts the animated journey. Map arrows still switch directly.
  [Browser checks and limits](validation/2026-10-25-room-first-entry.md).

- Latest animation rule: only Mirror Room's Back to town calls beginJourney(true).
  Login and map Menu travel use an immediate static town selector. Town controller
  arrows call changeMapWorld directly; existing worlds use enterWorld and empty slots
  show their entry forms, with no shuttle scene or departure delay.
  [Checks and scope](validation/2026-10-25-room-only-departure.md).

- Explore the public town now opens PublicTowns, not slot 0. discoverable_worlds returns
  only unjoined towns that allow strangers and have member capacity, with five summary
  fields and no invitations/resident data. Join chooses a free non-public slot and uses
  joinOpenWorld plus committed-selection confirmation. All joined towns, including the
  lobby, remain named destinations. Local upgrade preserved data; see
  [checks and scope](validation/2026-10-25-public-town-discovery.md).

- Empty-world create/join uses a centered, up-to-960px dialog, two columns above 680px and one below; Replay/Skip are hidden in this state. Scroll remains only as a height/accessibility fallback. [Checked layouts](validation/2026-10-25-centered-town-entry.md).

- User explicitly confirmed this is an English app. Keep authored UI labels, navigation and error messages in English; user-created town names remain as entered. Journey labels are now Choose a town / Explore the public town / Create or join a town / Back to towns.

- Journey destinations now show two fixed actions (public town; create/join new town),
  followed by existing non-public town names. No empty placeholders in this selector.
  Public means existing slot 0; new/join chooses the first free non-public slot or reports
  the existing 5-slot capacity. [UI checks](validation/2026-10-25-town-destinations.md).

- App now opens a departure journey before world entry, reusing only 1ec3221's standalone
  art/path handoff. WorldJourney / DepartureScene render the scene; App uses real world
  slots and waits for committed membership selection before departing. Map arrows and
  Menu → Travel to a world reopen it. Skip/Replay never issue backend calls. Empty slots
  keep invitation/create forms and gray background. No backend upgrade this delivery.
  [Checks, screenshots and remaining coverage](validation/2026-10-25-departure-integration.md).

- Menu's Guest session is sign-in mode, while World owner / World member uses my_worlds.isOwner.
  For the current Local Test World, the 127.0.0.1 guest is owner and localhost guest is member.
  These origins have separate guest tokens; use the creator's origin to keep that identity.
  [Actual UI checks](validation/2026-10-25-world-role-label.md).

- Latest addition (2026-10-25): an existing identity prototype automatically seeds one fresh
  independent mirror when entering a world without an owned resident. New/create/join/enter
  paths share the same transaction; repeated entries reuse existing residents. Private
  mirror_prototype stores initial name/look/personality/intent only, with lazy legacy backfill
  from the lowest owned non-demo ID. No contact, cards or history cloning; no prototype editor.
  [Checks and exact scope](validation/2026-10-25-auto-world-mirrors.md).

- Latest fix (2026-10-25): mirrors stay in their creation world; entering another world only
  changes the view. New worlds receive independent mirrors/profiles/contacts/cards. All worlds
  tick without viewers, with world-specific clocks, randomness and quotas. Added private
  world_simulation through a non-destructive local upgrade; legacy world_runtime retained.
  No copies of previously moved mirrors can be recovered automatically. Same-identity tabs
  still share the selected view. [Evidence and limits](validation/2026-10-25-independent-world-mirrors.md).

- Current default dev/build target is worldtest. Backend 127.0.0.1:3010 / mirrorville-worlds-test,
  frontend 127.0.0.1:5173; use `npm.cmd run setup:worlds`, then `npm.cmd run dev` after restart.
  Real server membership and creator identity replace fake role switching in this mode.
  Schema/client bindings target this new test database and must not be published to the old
  shared database without a migration plan. No real model keys or email login configured.
  [Setup and behavior](design/local-world-test-environment.md), [checks/known failure](validation/2026-10-25-local-world-backend.md).

- Earlier frontend-only iteration (superseded in worldtest): empty slots show Join a world (invitation input) and Create new world. Invitation
  handling is format-only and explicitly unavailable for real joining; no input URL is
  fetched or opened. Creation saves a local slot using the settings form. On reload,
  valid saved extra-slot settings restore that world with empty map art, without shared
  residents, diaries or mirror creation. Only slot 1 presents live shared town data.
  [Actual checks](validation/2026-10-25-empty-world-entry.md).

- Earlier frontend-only iteration (superseded in worldtest): Menu's Preview as selector defaults to
  World owner; Visitor hides the editor, as do uncreated slots. Browser storage key
  `mirrorville-world-settings-preview-v1/<worldId>` holds name/introduction, strangers
  flag and maximum people. It is shared within this browser origin and does not prove
  real ownership or enforce access/capacity. Defaults are 20 people / strangers off,
  with UI range 1–100. [Checks and limits](validation/2026-10-25-world-settings.md).

- Historical frontend-only iteration (superseded in worldtest): `WorldNavigator.tsx` defines one live Mirrorville
  slot and four initially uncreated slots (now supporting local creation previews).
  Empty slots unmount the canvas, hide clock/camera and
  disable Diary, Residents and mirror creation. Mirror Room stays enabled when an owned
  mirror is available, opens that same personal room from any slot, and returns to the
  selected slot. The database connection continues; reload resets
  the selected slot. Do not treat this as private-room isolation or invitation support.
  See [checks and screenshots](validation/2026-10-25-world-navigation.md).

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
  goes in the browser. Existing guest mirrors are not migrated into account ownership.

- **Fidelity A/B** (`yw/fidelity`): imports now require `latestAt` (empty string for unknown), merge a
  complete card set and update the private summary. Regenerate client bindings after publication.
  Local migration is additive and used `--delete-data=never`. Test mirrors are 10/11; do not use
  mixian id 9 for QA. Counts, Pending subjective acceptance and the delayed main rebase are in
  `validation/mirror-fidelity-a-b.md`. No Part C or 0004 changes.

- **Published character scope**: original plus Rust/Sage/Honey/Coral are integrated with the existing online creation form. Four-direction full walk uses 5fps `[0,1,2,1]`; new looks reuse IDs 1–4, legacy 0/5–7 retain original. Character assets require no backend/schema/bindings changes. See `validation/character-release.md`; source/preparation is in `art/characters/README.md`. The local room-journey and other unfinished work are not included in this release.

- **Change existing appearance**: Mirror Room -> Change appearance previews and saves one of five looks using owner-only `setAppearance`. Only mirror.look changes; existing data and table schema are retained. Maincloud was upgraded with --delete-data=never; bindings were regenerated. See validation/appearance-change.md for 88 tests, real cloud save/reconnect and denial checks.
