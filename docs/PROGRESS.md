# Current work

Goal: a demo where a judge makes a mirror, watches it live in town, reads its diary, and shows
interest in someone (see `core/principles.md`). Deadline: Devpost first submission Sun 2026-10-25 09:00 PT.

## Where things are

- What exists: `state/project-structure.md`. What has been checked: `validation/`.
- Why it is built this way: `decisions/` (0001-0008). Product thinking: `design/product-pipeline.md`.

## Entry screen

The team's Figma login screen is implemented with local exported assets. SpacetimeAuth accounts and
explicit browser guests are integrated; see `validation/login-figma-and-auth.md` for user-assisted
login, verified guest compatibility and Pending cross-browser/expiry checks. The auth project is
configured on Maincloud, while the town simulation remains local.

Guest-to-account transfer and reversible resident management are implemented; see
`validation/guest-account-transfer.md`. Account-based cleanup retains Yiqiao Liu #12 and mixian #9
in town; guest/test data remains archived. Real email transfer acceptance is pending.

Phone entry layout, compressed production sharing and the current tunnel's exact auth callbacks
were repaired after phone feedback; see `validation/mobile-login-and-share-performance.md`.

## Next

Teammate-authored town art and full-screen General/Follow cameras are integrated on
`yw/map-assets`; see `validation/authored-town-and-camera.md`. Teammate's Home scene is also
integrated; see `validation/authored-mirror-room.md`.

Mirror fidelity Parts A/B are implemented and locally tested on `yw/fidelity`; see
`validation/mirror-fidelity-a-b.md`. Owner judgment of the summary/cards and the rebase after diary
merges into main remain Pending. Part C is not included.

1. Diary, visible interest, contact unlock and Mirror Room contact field implemented (0008); see
   `validation/0008-diary-and-mutual-interest.md` for acceptance results and remaining checks.
2. Public deployment (0007): first check that a Maincloud procedure can call DeepSeek.
3. Agree on the remaining drafts on branch `yw/proposals`: postcard privacy, CREAO team brief
   (`npm run check-decisions` lists drafts on every branch).
4. Anthropic key → validate the Claude judgment path (0002).
5. Pitch: demo script, video backup, Devpost page; collect real usage at the venue.

Ideas nobody has evaluated yet live in `backlog.md`. Branch and decision-numbering rules are in
`decisions/README.md`.

## Teammate login/map repair

Integrated yq 7c7f5e6 into yw/map-assets: comma-containing asset filenames now load correctly
through local Vite, and desktop email placement/focus follow the teammate's repair. Their
original evidence is in validation/2026-10-24-login-focus.md and
validation/2026-10-24-shared-frontend-preview.md. Hosted login may still require a second
email entry; see validation/2026-10-24-email-login-investigation.md.

## Import-first onboarding and voice

Import/voice data flow is implemented, and its UI has been revised under the owner's direction:
first onboarding now happens in one continuous room with an anchored character speech bubble,
letters and current response. Name-only entry can go straight to town without tags or a questionnaire.
The desk, fact cards, voice rehearsal, daily question and optional check use individual exchanges.
See `decisions/proposed-scene-first-meeting.md`, `design/first-meeting.md` and
`validation/interactive-first-meeting.md` for current interface evidence. The original import/privacy
checks remain in `validation/import-onboarding-and-voice.md`. Human voice acceptance and actual
ChatGPT/Claude phone timing remain Pending; Part C is not included.

## Room actions and contextual voice rehearsal

The owner's follow-up replaces static scene overlays with an actual character journey: tag ->
walk to desk -> receive/read material -> walk to mirror -> contextual reply and owner rewrite -> door.
Characters are larger with grounded feet. Desk/mirror furniture in existing rooms enters the same
journey. See `decisions/proposed-room-actions-and-rehearsal.md` and
`validation/room-actions-and-rehearsal.md` for the current implementation and visual evidence.
Factual-card correctness and voice fidelity are separate; small-sample corrections provide initial
expression guidance, while owner/friend voice acceptance remains Pending.

## Four-source background and recent life

The desk now has one letter entrance with direct desktop observation, public GitHub projects/activity,
AI introductions and deliberate updates/writing. Sources share local review and existing import
handoff. An independent optional Windows helper adapts Marglo's observation idea, starts paused,
and exposes local tentative clues after pairing/enable. Legacy Marglo packages are secondary.
See `design/four-source-learning.md` and `validation/four-source-learning.md` for implemented limits
and evidence. Photos/audio and automatic cloud sharing are not implemented.

## iPhone deliberate sharing

Text/link fragments from the native source or a manual Shortcut now reach a private local draft,
not an automatic import. Login/town stay usable; owner selection or new-mirror paper review is
explicit. Reference quotes remain local and require the owner's own meaning note. Parser, ownership,
StrictMode and authentication regressions pass; actual device/native install acceptance remains
Pending. See `design/iphone-web-receiver.md` and `validation/iphone-web-receiver.md`.
