# Handoff

Things that are not obvious from the code.

- **Shared preview performance / login**: public `*.trycloudflare.com` requests now serve the
  production `dist/` build through `scripts/share-preview.ts`, gzip-compressed, with no dev module
  graph. Localhost keeps HMR. Run `npm.cmd run build` after changes to update the share URL.
  After restart, start the local database/dev server and create a new tunnel before sharing.
  The old tunnel URL is temporary. Town artwork uses WebP and explicit loading/retry (no old-map fallback).
  Login images have smaller WebP variants and the mobile form is in normal flow; originals remain.
  The current tunnel's exact login/logout callbacks were saved in SpacetimeAuth with owner approval;
  a replacement tunnel needs replacement exact entries. See `validation/mobile-login-and-share-performance.md`.

- **Authored Mirror Room** (`yw/map-assets`): `origin/yq` commit `1f404a9` supplies `Home.tscn`
  and five PNGs. Regenerate with `node scripts/import-home-scene.mjs 1f404a9`. Keep generated
  `src/homeScene.json` in sync. All existing room actions remain connected; no data migration.
  Checks and remaining device validation are in `validation/authored-mirror-room.md`.

- **Authored town / camera** (`yw/map-assets`): imported `origin/yq`'s `329e7e8` scene;
  regenerate with `node scripts/import-town-scene.mjs 329e7e8`. The town fills the viewport,
  with General/Follow modes and owned-mirror selection. General defaults to viewport cover
  with touch/pointer drag; conversation text is kept in character panels, with tiny pixel
  indicators on the map. No database publication is needed.
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
- **Demo mirrors** (Yun, Marco, Priya, Sam, Lena) are owned by the publisher, always wave back, and only
  chat among themselves at a reduced rate.
- **Docs reader**: `python .agents/skills/orrery-docs-local/scripts/orrery_docs.py build --target .`, then open
  `docs/_site/orrery-docs.html` (generated, gitignored).

- **Login**: the entry page uses the team's exported Figma assets. Accounts use SpacetimeAuth email
  magic links; guests keep their original local token. This machine's `.env.local` has the public
  `VITE_SPACETIMEAUTH_CLIENT_ID`. For setup, exact callbacks, cloud ownership and limitations see
  `design/login-and-auth.md`; acceptance is in `validation/login-figma-and-auth.md`. No client secret
  goes in the browser. Existing guest mirrors are not migrated into account ownership.

- **Fidelity A/B** (`yw/fidelity`): imports now require `latestAt` (empty string for unknown), merge a
  complete card set and update the private summary. Regenerate client bindings after publication.
  Local migration is additive and used `--delete-data=never`. Test mirrors are 10/11; do not use
  mixian id 9 for QA. Counts, Pending subjective acceptance and the delayed main rebase are in
  `validation/mirror-fidelity-a-b.md`. No Part C or 0004 changes.
