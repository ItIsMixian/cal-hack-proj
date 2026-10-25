# Latest yw/map-assets update into local yq

Date: 2026-10-24.

## Inputs and scope

- Target before merge: yq `7c7f5e61c9f02283c8eb1f1ff3ad5e2539ee41b9`.
- Confirmed source: origin/yw/map-assets `7509d4ba95dd383d6b0befee23c84d6246383b69`. The user confirmed this source after the remote branch check found no xw branch.
- The update includes movement/navigation, town timing, indoor portrait pins, HUD changes, compressed/preloaded Home art and resident controls. Existing local login/map repairs are retained.
- Code merged automatically. The PROGRESS conflict combined the existing outstanding-work list with the incoming repair notes, removing duplicated next-step text. Current source and check links were updated.
- Original Godot files, existing personal Proposed documents and consensus principles are preserved. The incoming town-timing draft remains Proposed; code implementation does not turn it into an ADR.

## Local checks

- PASS: `npm.cmd run build` completed the frontend typecheck and production build.
- PASS: `node.exe node_modules/typescript/bin/tsc --noEmit -p spacetimedb` completed the backend typecheck.
- PASS: all 72 tests across the nine existing test files passed, none skipped. Coverage includes auth, diary, fidelity, Home conversion, importers, roaming, share preview, navigation and town conversion/motion.
- PASS: original mirrorvile files, shared principles, numbered consensus ADRs and all nine pre-existing Proposed files match the target before merging. Existing login CSS and comma-safe town asset loading are retained. The application tree matches the confirmed source branch.
- PASS: no unresolved conflict entries remain. All 189 relative links across AGENTS and 70 docs Markdown files have existing targets.
- PASS: rebuilt the offline documentation reader; all 71 embedded author records match paths and contents.

## Not covered

No live database publication or migration, refresh_world_schedule call, resident-state changes, model calls, real authentication, tunnel changes or deployment. Imported source-machine evidence is not a local runtime check. This operation merges into the local checkout; remote yq is not pushed.
