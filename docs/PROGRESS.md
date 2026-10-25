# Current work

Completed integration: the web and desktop demo, English interface copy, Maincloud
data migration and production guest entry are delivered. Live web demo:
https://itismixian.github.io/cal-hack-proj/ . See
[integration verification and remaining limits](validation/2026-10-25-integrated-cloud-demo.md).
ADR 0008 and 0009 are implemented on `main`; their validation links are in the
[decision index](decisions/README.md).

Latest: temporary guest residency and a host-controlled Demo OFF/ON switch are implemented. Protected mixian #9 retained; duplicate #18 retired. [Checks](validation/2026-10-25-guests-and-demo-toggle.md).

Latest integration (2026-10-25): yw web/desktop + yq independent worlds and room-first entry are combined. Maincloud migration preserves the original local database and resident ID 9. See [integration checks](./validation/2026-10-25-integrated-cloud-demo.md) for deployment state and Pending checks.


Goal: a demo where a judge makes a mirror, watches it live in town, reads its diary, and shows
interest in someone (see `core/principles.md`). Deadline: Devpost first submission Sun 2026-10-25 09:00 PT.

Latest 2026-10-25: create/join entry includes public-town discovery and name/introduction
search. Desktop shows three entry columns; return preserves the invitation draft and
origin slot. Build and actual map/journey/search/back checks passed; map-origin discovery
has no shuttle. [Evidence](validation/2026-10-25-empty-world-public-search.md).

Latest 2026-10-25: initial entry and refresh now open Mirror Room directly, including
the no-mirror welcome state. Mirror creation opens inside the room; Go to town starts
the departure journey. Build, 8 room/renderer checks and browser entry/refresh/cancel/
departure-to-map checks passed. [Evidence](validation/2026-10-25-room-first-entry.md).

Latest 2026-10-25: shuttle animation is restricted to leaving Mirror Room. Town map
arrows switch adjacent slots directly; login/menu town selection is static. Build,
5 renderer regressions, actual map switching in both directions and static menu entry
passed. [Evidence and limits](validation/2026-10-25-room-only-departure.md).

Latest 2026-10-25: Explore the public town opens a separate discovery list of open,
unjoined towns with space. Joined towns, including the default lobby, appear by name
in the main list. Public joins use transactional admission and existing confirmed
departure/automatic-mirror paths. Non-destructive local upgrade, production build,
5 journey checks, live multi-identity discovery/admission checks and actual list UI
verified. [Evidence and limits](validation/2026-10-25-public-town-discovery.md).

Latest layout fix, 2026-10-25: create/join is centered at up to 960px, with desktop columns and a compact phone stack. No internal overflow at the checked 635×871, 1440×900 and 390×844 sizes; build passed. [Evidence](validation/2026-10-25-centered-town-entry.md).

Latest UI adjustment, 2026-10-25: journey selection now shows Browse public town,
Create/join new town, then existing non-public town names. Uncreated slots are hidden;
creation/joining chooses a free slot automatically. Build and actual browser entry checked.
[Evidence](validation/2026-10-25-town-destinations.md).

Latest addition, 2026-10-25: departure animation is integrated into real world entry.
Login/App mount and map/menu travel go through home → shuttle → real world selection;
confirmed backend entry precedes departure. Error and repeated invitations checked in
browser. 93 relevant tests + build passed; desktop/phone checked. Only departure handoff
imported from 1ec3221; [evidence and limits](validation/2026-10-25-departure-integration.md).

Latest UI fix, 2026-10-25: Menu separates Guest session (sign-in mode) from World owner /
World member (server world role). Different localhost / 127.0.0.1 origins retain different
guest identities. Build and actual owner/member menus checked; [evidence](validation/2026-10-25-world-role-label.md).

Latest addition, 2026-10-25: existing users enter new worlds with an automatically created
independent mirror based on a saved identity prototype. Repeat entry reuses the resident;
first-time users still onboard once. Private prototype table added without clearing data.
[Validation and base-field scope](validation/2026-10-25-auto-world-mirrors.md).

Latest fix, 2026-10-25: independent world residents and simulations replace mirror travel.
Switching views preserves residents, conversations and rest; each world has its own mirrors,
private profile data and quotas. All worlds tick without viewers. Deployed locally without
clearing data; [validation and remaining limits](validation/2026-10-25-independent-world-mirrors.md).

Latest delivery, 2026-10-25: isolated SpacetimeDB 2.13.0 backend is running on 127.0.0.1:3010,
database mirrorville-worlds-test; frontend 5173 now uses worldtest mode. Real create/join,
owner settings, invitations, member limits and world-scoped data are connected. 78 relevant
unit checks and live multi-identity/concurrent-join checks passed; the older Status card
suite remains a known failure. Restart/persistence and browser invitation joining checked.
Start with [environment instructions](design/local-world-test-environment.md) and
[actual validation](validation/2026-10-25-local-world-backend.md). Earlier frontend-only
entries below describe prior iterations. No shared-database upgrade or AI-key import.

Latest addition, 2026-10-25: uncreated worlds now have a two-part entry window for an
invitation link or creating a new world. Creation produces a saved device-local map
preview; invitation joining remains a labeled placeholder with format validation.
Build and desktop/portrait browser checks passed; [scope and evidence](validation/2026-10-25-empty-world-entry.md).

Latest UI addition, 2026-10-25: Menu has an owner-only Edit world frontend preview,
with name/introduction, strangers switch and maximum people. Preview as toggles owner
and visitor views; settings persist on this device and update the nameplate. Actual
server ownership/admission is pending, per the user's chosen frontend-only scope.
See [validation and screenshots](validation/2026-10-25-world-settings.md).

Latest frontend change, 2026-10-25: Town Map now has the supplied world-name frame,
five status dots and wrapping arrow navigation. Mirrorville is the only connected
world; initially empty slots show a plain dark-gray background until a local preview is created. Mirror Room remains enabled
for an available owned mirror from every slot and opens the same personal room. Production build and
desktop/portrait browser checks passed. No server multi-world capability is implied;
see [scope and validation](validation/2026-10-25-world-navigation.md).

Latest runtime check: the user reported connection refused at `127.0.0.1:5173`; no frontend listener was running. Restarted the existing Vite server as a hidden background process and confirmed HTTP 200 with the React entry. Current browser/backend behavior was not rechecked because local browser use is disabled in Work settings. The prior shared-origin guest/7-mirror/Residents and hosted login checks remain historical; see [runtime validation](validation/2026-10-24-local-frontend-runtime.md).

## Where things are

- What exists: `state/project-structure.md`. What has been checked: `validation/`.
- Why it is built this way: `decisions/` (0001-0008). Product thinking: `design/product-pipeline.md`.

## Entry screen

The team's Figma login screen is implemented with local exported assets. SpacetimeAuth accounts and
explicit browser guests are integrated; see `validation/login-figma-and-auth.md` for user-assisted
login, verified guest compatibility and Pending cross-browser/expiry checks. The current
published web demo uses Maincloud for both authentication and the migrated town simulation;
the original local database is retained independently. See the
[cloud migration and production checks](validation/2026-10-25-integrated-cloud-demo.md).

Phone entry layout, compressed production sharing and the current tunnel's exact auth callbacks
were repaired after phone feedback; see `validation/mobile-login-and-share-performance.md`.

## Next

The integrated web and desktop demo is deployed; see
`validation/2026-10-25-integrated-cloud-demo.md`. Fidelity A/B, onboarding, guest lifecycle
and the host demo toggle are implemented. Main's accepted 0010 and fidelity C remain
unimplemented; merging their documents does not change runtime evidence checks.

1. Complete remaining live acceptance checks recorded in `validation/`.
2. Review the remaining proposed decisions and accepted-but-unimplemented work

   (`npm run check-decisions` lists drafts on every branch).
3. Anthropic configured; complete cloud application-path acceptance (0002).
4. Pitch: demo script, video backup, Devpost page; collect real usage at the venue.

Ideas nobody has evaluated yet live in `backlog.md`. Branch and decision-numbering rules are in
`decisions/README.md`.

## Teammate login/map repair

Integrated yq 7c7f5e6 into yw/map-assets: comma-containing asset filenames now load correctly
through local Vite, and desktop email placement/focus follow the teammate's repair. Their
original evidence is in validation/2026-10-24-login-focus.md and
validation/2026-10-24-shared-frontend-preview.md. Hosted login may still require a second
email entry; see validation/2026-10-24-email-login-investigation.md.
