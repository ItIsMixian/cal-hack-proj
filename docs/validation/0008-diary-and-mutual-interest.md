# 0008 diary and mutual interest validation

Date: 2026-10-24 (America/Los_Angeles). Branch: `yw/diary`, based on local `main` at `8c6b381` (see Git history for the exact base). Backend stage: `942554f`; frontend stage: `8cbfd07`; validation-stage refinements are included with this record.

## Accepted when (plan checklist)

| Plan condition | Result | Evidence / boundary |
| --- | --- | --- |
| Visitor talks to a demo mirror; first-person diary with place and other name appears | **Pass** | Real local simulation + configured model: Diary Alice (mirror 7) talked to Marco (2). `my_diary` displayed “I was at the Food Court … I talked with Marco” with Food Court, time, name, and day heading. Later a second entry about Yun appeared above it. No fixture diary was inserted into the live database. |
| Interest on demo entry becomes mutual; demo placeholder and visitor's contact visible to the respective sides | **Pass** | In the browser, Alice saved `diary-alice@example.test` in Mirror Room, then clicked “I'm interested” on Marco's entry. The live subscription showed “Marco is interested in you too”, “You both said yes”, and `Marco · demo contact (placeholder)`. Publisher's owner-scoped `my_diary` query for mirror 2 returned `other_name = Diary Alice`, `mutual = true`, `their_contact = diary-alice@example.test`. |
| Two browsers: A interests B, B sees A's interest, B reciprocates, both see contacts; no popup | **Pending** | Two independent origins were prepared: `http://localhost:5173/` owns Diary Alice (7); `http://127.0.0.1:5173/` owns Diary Bob (8). Both contacts were saved through their own Mirror Rooms. They had not completed a conversation with each other during the checked period, so the full human-to-human browser sequence has not been claimed as passed. The actual reducer/view callback test covers one-sided visibility, contact hiding, reciprocal unlock, and repeated-click deduplication, but is not a substitute for this browser acceptance. No popup appeared in the completed demo sequence; both tabs reported no JavaScript dialog. |
| Both typechecks pass; results recorded | **Pass** | `npx.cmd tsc --noEmit -p spacetimedb` and `npx.cmd tsc --noEmit -p .` both exited 0. `npm.cmd run build` exited 0 (66 modules transformed). This record lists the unchecked scope explicitly. |

## Automated domain regression

`npm.cmd run test:diary`: **10/10 passed**. The harness transpiles and executes the actual backend callbacks with an in-memory database/context and a controlled judgment response. It does not emulate SpacetimeDB's subscription engine, transaction rollback or real model behavior.

Covered: diaries for both participants even without a connection; place/name/first-person text; owner isolation; retry idempotency; visible incoming interest; contacts hidden until mutual; contacts unlocked on both sides; demo reciprocity; owner-only actions; 120-character limit and empty contact; no contact redaction; unsupported evidence and premature shared-interest rejection; model-failure factual diary fallback; timestamp ordering; live contact edits; pair deduplication; two-per-day cap (including multiple mirrors owned by one person); private table declarations and removal of retired client APIs.

Compared the full `normalize` / `supported` block and the connection-validation block byte-for-byte against `main`: **unchanged**. `docs/core/principles.md` and `docs/decisions/0004-evidence-and-conduct.md` have no branch diff.

## Publication and bindings

SpacetimeDB CLI/SDK 2.13.0; existing local server `http://127.0.0.1:3000`, database `mirrorville`.

```text
spacetime publish mirrorville --module-path spacetimedb --server http://127.0.0.1:3000 --delete-data=never --yes=migrate,break-clients,skip-login
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb --yes
```

**Pass:** additive migration appended `mirror_profile.contact` with an empty-string migration default and created private `diary_entry` / `interest` tables. Existing mirrors and model keys remained; real model conversations continued after publication. No data-clearing publication was performed. View changes disconnected existing clients as expected; the new frontend connected successfully.

The running CLI executable was missing from its reported location in this execution environment. An official 2.13.0 CLI was downloaded under `C:/Users/1/tmp/mirrorville-cli-2.13/` to run these commands. No CLI binaries or credentials were added to the repository.

`encounter` and `human_message` tables are retained for data-preserving migration. New conversations do not write them. The old `my_postcards`, `my_human_messages`, `wave`, and `send_human_message` APIs and generated bindings are removed; old postcards count toward prior pair/daily limits. The new diary adds a conversation ID for retry deduplication. Daily marks count distinct conversations per non-demo owner, preserving the original one-postcard-per-pair counting even when one owner has multiple mirrors.

## Browser and visual checks

- In-app browser: actual CSS viewport measured 447 pixels wide, document scroll width 432; no horizontal overflow. Contact editor saves and survives leaving/re-entering Mirror Room. Its input has `maxlength=120`.
- Edge: actual viewport measured 1384 × 776, document scroll width 1369; town map and diary panel sit side-by-side. Diary tab and empty state work.
- Checked readable text, date/name hierarchy, section spacing, button state, contact wrapping and narrow-screen stacking. Existing town style preserved. Demo interaction stayed inline; no new popup, toast, expiry or decline action.
- The in-app viewport override did not change its measured width; no claim is made for an exact 390-pixel device. Temporary override was reset.
- In-app browser console error query returned no errors after the demo interaction.
- Actual mobile hardware, exact 390-pixel viewport, day rollover, network-failure UI, and Claude-specific model output: **Pending**. Model fallback and ownership failures are covered only at callback level.

Screenshots: [demo mutual](0008-assets/demo-mutual.png), [desktop diary](0008-assets/desktop-diary.png), [contact field](0008-assets/contact-field.png), [mutual detail](0008-assets/demo-mutual-detail.png).

## Resume the Pending two-visitor acceptance

Keep the two origin tabs/identities that own Alice and Bob. After their mirrors finish a conversation, open Diary on both sides. A clicks “I'm interested” on the entry about B; B must show the incoming-interest text and neither side may show contact yet. B clicks “I'm interested”; both contacts must appear without a popup. Refresh to confirm persistence and optionally edit/clear a contact in Mirror Room to check subscription updates. Record the observed result here; do not count the callback test as this browser check.

Test mirrors and synthetic `.test` contact details remain in the local database. No reset was used to remove them.
