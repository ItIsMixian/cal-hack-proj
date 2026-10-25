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
