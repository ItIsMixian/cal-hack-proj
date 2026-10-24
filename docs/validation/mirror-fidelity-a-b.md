# Mirror fidelity Parts A/B

Date: 2026-10-24. Branch: `yw/fidelity`, created from `yw/diary` at `e790c67`. Implementation commit: `95e5c8a`. Plan read from main at `b4ca430`, `docs/implementation/plans/mirror-fidelity.md`. The user's explicit branch/start instruction overrides the plan's wait-before-start wording. Part C is excluded.

## Accepted when

| Criterion | Result and evidence |
| --- | --- |
| At most two cards per facet after importing the owner's sources into an empty test mirror | **Pass**. Fresh local mirror **10**, isolated QA identity, imported regenerated projects/study/ideas/life AI files, then the dated WeChat text. All facet counts stayed at 0–2. |
| No Humor/Warmth inferred from AI-only imports | **Pass**. After each of four AI imports, Humor=0, Warmth=0. Server tests also reject prohibited model output and remove unchanged legacy AI-only interpersonal cards while preserving owner edits. |
| No old Recent cards from historical WeChat messages | **Pass**. A separate fresh mirror **11** imported only the WeChat text tagged with its 2025 latest-message date: Recent=0. Mirror 10 retains one Recent card from its earlier AI input, not the historical WeChat input. |
| Second import merges instead of appending | **Pass**. First AI import produced 8 cards; second remained at 8, with `0 new · 1 rewritten · 0 removed`. Existing IDs were reused and previous text populated. Subsequent imports also updated a complete set. |
| Owner-edited cards unchanged, occupy facet slots | **Pass**. Live test edited a card on mirror 10, reimported, and verified identical owner text and edited flag. The synthetic edit was then undone; a further WeChat merge regenerated the summary without the test text. Unit tests cover omitted and altered protected cards. |
| Undo restores a model rewrite | **Pass**. On mirror 10, called undo for a model-rewritten card and verified equality with the prior `previousText`. |
| Owner confirms summary/cards still sound like them | **Pending**. Technical QA is not the owner's subjective judgment; no approval/rejection has been invented. |
| Summary understandable at 375 px without scrolling past it | **Pass**. Actual MirrorRoom with live QA identity rendered in a 375 × 812 CSS viewport; summary is directly below the room header, before the room scene. |
| Chip state clear without colour | **Pass**. Actual QA card toggled off and back on, with ✗/✓, dashed outline vs solid filled state, and `aria-pressed`. [Screenshot](fidelity/chip-states.png). |
| Typechecks and build | **Pass**. `npm.cmd run build`; `npx.cmd tsc --noEmit -p spacetimedb/tsconfig.json`. |
| Part C criteria | **Out of scope**, as requested. No changes to 0004 or principles. |

## Live import counts

Only counts and change statistics are recorded, never source messages.

| Test mirror / import | Total cards | Core | Humor | Warmth | Professional | Interests | Recent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 / projects (AI) | 8 | 2 | 0 | 0 | 2 | 2 | 2 |
| 10 / study (AI) | 8 | 2 | 0 | 0 | 2 | 2 | 2 |
| 10 / ideas (AI) | 8 | 2 | 0 | 0 | 2 | 2 | 2 |
| 10 / life (AI) | 8 | 2 | 0 | 0 | 2 | 2 | 2 |
| 10 / WeChat and repeat merge | 7 | 2 | 0 | 0 | 2 | 2 | 1 |
| 11 / historical WeChat only | 6 | 2 | 0 | 0 | 2 | 2 | 0 |

Summaries were present after each successful import. **Mixian id 9 was never targeted**: a before/after hash of its complete card rows remained equal. No reset reducer was called. The database was republished with `--delete-data=never`; migration added only `import_job.latest_at` with an empty-string default, private `mirror_summary`, and owner view `my_summaries`.

## Automated and client checks

46 tests pass: fidelity (12), importers (10), diary (10), authentication (8), roaming (6). Commands: `node --test scripts/test-fidelity.mjs scripts/test-importers.mjs scripts/test-diary.mjs scripts/test-auth-session.mjs scripts/test-roaming.mjs`.

Coverage includes malformed/foreign/duplicate model IDs, full-set removals, protected slots, private-card classification preservation, scene/date guards, third-person storage vs owner display, two/four-digit WhatsApp years, day-first dates, invalid calendar dates, retained-sender CSV dates, and equal per-file budgets. Importer callback tests verify inferred AI source and balanced 30k budgeting across files. Invalid CSV privacy tests continue passing.

The real writing-desk UI displays `Read as: Other · change`; the optional selector was exercised to `AI assistant`. Initial source inference is covered by the file callback tests. Source JSON, credentials and local QA runners remain outside the repository. Temporary UI wrappers and their one-use local session bridge were removed/closed after QA.

Screenshots show inferred cards/summary only, not source messages: [375 px summary](fidelity/summary-375.png), [chip states](fidelity/chip-states.png), [scene override](fidelity/read-as-ai.png).

## Export preparation and remaining limits

The existing scratchpad `export-my-words.mjs` now prefixes each regenerated AI file with `# Mirrorville scene: ai`. Its broad cleanup was removed so it does not delete the WeChat output. Four AI files were regenerated outside the repository. The external WeChat exporter also emits an explicit friends scene and latest-message ISO header; this prevents old undated TXT exports from appearing current. No exported files or databases are committed.

Known boundary: protected owner edits can exceed the two-card facet limit if already present; they are preserved, with overflow hidden behind More cards. This resolves the conflict in favour of the explicit never-touch-owner-edits rule. The current-input date gate affects new/rewritten Recent cards; unchanged current cards from earlier sources can survive. Single undated-current detection is conservative lexical gating plus the model instruction, not independent temporal inference per sentence.

Physical phone/screen-reader checks, model-failure/stale-write behavior exercised against the live server, and subjective fidelity remain **Pending**. Deterministic guard tests cover stale dates and invalid model collections.

## Rebase follow-up

**Pending**: origin/main did not yet contain the diary base `e790c67` at the final check. An hourly thread follow-up is configured to verify the merge and then rebase fidelity-only commits onto current main, with a clean `yw/fidelity` checkout and no force-push. It stays quiet while the merge condition is unmet and reports completion or required action. The follow-up must update this section after rebase.
