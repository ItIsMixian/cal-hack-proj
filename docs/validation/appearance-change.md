# Change an existing mirror appearance

Owner-requested follow-up to character release 15e9756. Entry: Mirror Room -> Change appearance -> preview -> Save appearance. Cancel leaves the saved look unchanged. The editor locks controls while saving and retains its draft/error for retry. Legacy color-only looks display Original without silently rewriting their saved marker ID.

## Backend and persistence

`setAppearance(mirrorId, look)` uses `ctx.sender` and the existing private profile ownership check; demo, unknown and other-owner mirrors are denied. Only IDs 0–4 can be saved. The reducer changes only `mirror.look`, so names, identity, position/route, conversations, diary, cards and contact are preserved. Existing table subscriptions update town and portraits. No new tables or columns.

Maincloud module `mirrorville-yw9299-world` was upgraded with `--delete-data=never`. Before/after schema comparison confirms all table definitions are identical and the only added reducer is setAppearance. Local backend was also upgraded without schema migration or data reset. Client bindings were regenerated through the CLI.

## Validation

- Production build with `/cal-hack-proj/` and existing Maincloud/auth settings: Pass.
- Production-package `node --test scripts/test-*.mjs`: 88 passed, zero failed.
- Server callback tests cover ownership, invalid look IDs, idempotence, private profile/state preservation and owner-view propagation.
- UI callback tests cover local-only preview/cancel, pending save lock, exact mirror ID, error retention/retry and legacy look display.
- Real cloud end-to-end: synthetic owned resident Appearance QA (id 2) started as Sage. Preview Coral then Cancel kept Sage. Save changed to Coral immediately; a page reload/reconnect and reopening Mirror Room retained Coral. A request from the different CLI publisher identity returned Not your mirror, with stored look still 4.
- QA resident id 2 was reversibly set inactive after verification; all existing residents/data were retained. No personal text or contact was imported.
- [Editor screenshot](appearance-change/editor.png) shows the persisted selection in the production-package UI connected to Maincloud.

The release is based on 15e9756 and includes only this feature, generated bindings, tests and documentation. Concurrent local room/learning/source-intake work is not published by this release. The working checkout was being merged concurrently, so this release was prepared independently without changing its merge files/index.

## Publication

Uses the existing Pages workflow on yw/map-assets. Hosted deployment and UI checks are appended to the local validation record after publication.
