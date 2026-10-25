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
