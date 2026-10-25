# Local merge of yw/map-assets into yq

Date: 2026-10-24.

## Inputs and scope

- Target before merge: yq `1f404a9ba67b52ee594c2b0018dbe35449717c81`.
- Source downloaded by git fetch: origin/yw/map-assets `cd9a1910b23b42a05ee98106fce606e311f59c42`.
- Source was selected because it contains the teammate's application updates; origin/main currently adds documentation and origin/yw/proposals contains draft ideas. Neither branch is merged as part of this operation.
- Application code merged without conflicts. PROGRESS and project structure had documentation conflicts; the old yq texts are preserved in library/history/2026-10-24-before-code-merge.md and current summaries reflect the incoming implementation.
- Original Godot source files, personal Proposed documents and shared core principles must remain unchanged from target HEAD. Source ADR 0008's implementation status is imported with its existing validation, without altering its agreed product decision.

## Local checks

- PASS: installed 85 locked dependencies with `npm.cmd ci --no-audit --no-fund`; Node.js v24.14.0.
- PASS: `npm.cmd run build` completed the frontend typecheck and Vite production build.
- PASS: `node.exe node_modules/typescript/bin/tsc --noEmit -p spacetimedb` completed the backend typecheck.
- PASS: the eight existing Node test files for auth sessions, diary, fidelity, Home conversion, importers, roaming, share preview and town conversion ran 60 tests, all passed, none skipped.
- PASS: incoming src, spacetimedb, scripts, public, package files and Vite configuration match the source branch. The original mirrorvile tree, shared principles and seven existing personal Proposed documents are unchanged from the target before merging.
- PASS: no unresolved merge entries remain. Checked 174 relative links across AGENTS and 62 docs Markdown files, with no missing targets.
- PASS: rebuilt the offline documentation reader; its 63 embedded records (AGENTS plus 62 docs Markdown files) match author paths and contents exactly.

## Not covered

No Godot execution, live SpacetimeDB publication/migration, model calls, real account login, callback registration, tunnel or public deployment. Source validation files describe the original machine and are not local reruns. This operation makes code available in the local checkout; it does not imply a remote yq push.
