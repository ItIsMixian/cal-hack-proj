# Import-first onboarding and speaking-style calibration

The interface shown in this historical record has been superseded by [the scene-first meeting](interactive-first-meeting.md). Import/data validation below remains useful; use the newer record for current UI.

Date: 2026-10-24 (America/Los_Angeles). Branch: `yw/map-assets`, uncommitted working-tree implementation based on `a7f3e04`, alongside concurrent guest-account and resident-management changes. Scope: main's `import-first-onboarding.md` and mirror-fidelity Part D. The owner authorized implementing these here; this is not a Part C delivery.

## Automated checks

- `node --test scripts/test-*.mjs`: **93/93 passed** on the final code. Eleven dedicated learning tests execute actual reducer/procedure callbacks with in-memory contexts. They cover three-word creation, redacted initial import, AI provenance restrictions, private owner-filtered style, protected edits/votes, stale UI choices, daily skip/answer limits, venue midnight/DST, model failure, malformed or copied examples, stale card replacement, and the speaker-only style/topic prompt.
- Existing importer UI callback test now also checks AI summaries remain `other`, summaries are redacted, chat CSVs are marked own writing, and AI-chat files cannot learn voice.
- `npm.cmd run build`: **Pass** (client typecheck and production bundle).
- `npx.cmd tsc --noEmit -p spacetimedb/tsconfig.json`: **Pass**.
- SpacetimeDB 2.13 module build, generated bindings, and local publication: **Pass**. `git diff --check`: **Pass**.
- These callback tests do not emulate database transaction rollback or browser clipboard permissions; live publication/browser checks supplement them.

## Local migration and data

Used the original publisher's CLI config explicitly. The default CLI identity was different and received 403; no CLI login was changed. All successful publications used `--delete-data=never`. Migration added private `mirror_learning`, private `mirror_style`, owner views and defaulted `import_job.input_kind`; no reset or key replacement occurred. Existing reducers remain available.

Before the first publication: 13 mirror rows and 51 card rows. This work created only synthetic QA mirrors **14 (Onboarding QA)** and **15 (Starter QA)** through separate guest browser origins on port 5188. Mirror 14 reached 6 cards; mirror 15 retained 0 imported cards. Concurrent real visitor activity exists, so aggregate totals are not an ownership checksum. Existing owner mirrors were not used for mutations or imports. Both QA mirrors were reversibly moved out of town after checking, retaining their data.

## Browser and live-model checks

Browser: Codex in-app browser; temporary test origins `http://127.0.0.1:5188` and `http://localhost:5188`. The normal preview remains on port 5173. Verified at desktop 1280px and phone 375 x 812; temporary viewport overrides were reset.

| Scenario | Result |
| --- | --- |
| AI summary -> local redacted preparation -> create -> background import -> owner cards | **Pass**. Synthetic summary generated 5 cards; source shown as Your AI's summary, without creating style. |
| Fact confirmation | **Pass**. Owner button persisted confirmation and removed the check note. |
| Own messages -> style + five generated examples | **Pass** after retry. An early model request failed without replacing cards; later requests completed. |
| Original-sentence reuse | Found during QA: model copied source sentences into generated examples. Added normalized source-sentence/duplicate/length checks and at most one corrective model request. Final live five-example set passed these checks. Semantic near-copy detection is not guaranteed. |
| Yes/no style feedback and persistence | **Pass**. Synthetic QA marked one yes and one no; both were visible after a full reload. Automated tests additionally cover import-time preservation and owner style edits. This is not human voice acceptance. |
| Three-word fallback | **Pass**. Exactly three selected chips, remaining chips disabled, creation succeeds without ten questions, mirror appears in town, room explicitly states limited knowledge and links to import. |
| Daily answer | **Pass**. Saved a short synthetic answer; daily row date `2026-10-24`, count 1; question disappeared and the dated merge completed (`0 new, 1 rewritten, 0 removed`). |
| Daily skip | **Pass** on mirror 15. Question disappeared; no import/card added (0 cards retained). |
| Optional TIPI refinement | **Pass**. Ten selections in the room updated the original self-card, confirmed by live view and status. |
| Today-only topic and style in conversation writing | **Pass** in callback tests, including expired topic exclusion, owner-approved and rejected examples, and no other speaker's private style in the prompt. Live English voice quality remains Pending. |
| Archived QA mirror | **Pass**. No import banner pointing into its unavailable room; room fallback provides a return action. |
| Mobile visual checks | **Pass**. Wrapped labels and options, no horizontal overflow in inspected screens, readable prompt/copy controls, selected states conveyed by text/symbols, usable feedback actions, scrollable dialogs, existing room art retained. |

Screenshots contain synthetic QA only:

- [Desktop creation](onboarding-voice/create-desktop.jpg)
- [375px creation](onboarding-voice/create-mobile.jpg)
- [Thin mirror room](onboarding-voice/starter-mobile.jpg)
- [Persistent voice feedback](onboarding-voice/style-feedback.jpg)

## Pending human acceptance

- Measure actual 375px phone completion from QR/opening through five cards in under 60 seconds, once with ChatGPT and once with Claude. The external AI handoff was simulated with synthetic text here.
- Owner reviews real imported facts and records corrections/rejections.
- Owner accepts at least four of five voice examples after corrections; then owner plus a friend run the five-real/five-generated blind test. Synthetic yes/no clicks do not establish this.
- Physical phone clipboard permission/fallback behavior, keyboard/screen-reader acceptance, and real social conversation quality.
- Style learning needs at least 120 characters of explicitly identified own writing. Short daily answers still merge facts; AI summaries, AI chats and undeclared text files never generate style.

No raw personal exports, model keys, or owner messages are included in these records.
