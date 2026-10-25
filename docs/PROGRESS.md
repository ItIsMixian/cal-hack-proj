# Current work

Latest runtime check: after the user provided the current shared address, local guest entry renders the authored map and receives 7 mirrors; Residents opens normally. The ignored local environment now uses that shared origin and the existing documented public SpacetimeAuth client. Login reaches the official email form; no email was sent or real account sign-in completed. See [runtime validation](validation/2026-10-24-local-frontend-runtime.md) for the initial failure and recovery. Earlier Live/12-mirror evidence below remains historical.

Updated 2026-10-24. The latest teammate code from `origin/yw/map-assets` (`7509d4ba95dd383d6b0befee23c84d6246383b69`) is being merged into local `yq`, starting at `7c7f5e61c9f02283c8eb1f1ff3ad5e2539ee41b9`. The original Godot project and local login/map repairs are retained. Local checks are recorded in [update validation](validation/2026-10-24-update-yw-map-assets.md).

## Current implementation

- Building resident tags now open Status cards with name, current activity/location and recent exchanges limited to the user's own mirrors and that resident. The default is the latest 5 exchanges active within 7 days, using source-content highlights with optional transcript expansion. Build, 7 tests and desktop/portrait actual tag-click fixture checks passed; see [Status card validation](validation/2026-10-24-resident-status-card.md).

- Diary now prioritizes concrete conversation content: mentioned topics, questions, examples and details. Merged visits gather and deduplicate content from all source notes, retaining name grouping, the 30-minute rule, time/place and interest/contact controls. Build, backend typecheck, 25 diary tests and desktop/portrait previews passed. The updated topic-focused generation prompt remains unpublished; see [current content validation](validation/2026-10-24-diary-comments.md#conversation-content-instead-of-appraisal-2026-10-24).

- Mirror Room's four furniture names use the user's transparent scroll material. Names and frames are now enlarged together by 30% and shifted 32 CSS pixels upward. Desktop/portrait label clicks and long-name layout were checked; see [nameplate validation](validation/authored-mirror-room.md#larger-raised-nameplates-2026-10-24).

- Mirror Room fills the viewport with uniformly scaled artwork and bounded panning. The summary disclosure, privacy label and bottom shortcut buttons are removed. Four furniture objects remain clickable; the mirror panel now includes contact editing, replacing the independent Address book entry. Build, 16 diary/Home tests and desktop/portrait preview checks passed; see [merged mirror/contact validation](validation/authored-mirror-room.md#contact-editing-merged-into-the-mirror-2026-10-24). Earlier layout checks remain in that file.

- Mirror Room no longer displays a standing character/name button. Its removal check predates merging the Address book into the mirror; see [historical room validation](validation/authored-mirror-room.md#remove-standing-room-character-2026-10-24).

- Building resident portrait frames and portraits are 1.5× larger, with matching click bounds and wider row/column spacing. Production build and a live eight-resident layout/edge-click check passed; see [pin validation](validation/2026-10-24-building-resident-pins.md).

- General now supports cursor-anchored mouse-wheel zoom and bounded dragging. Minimum zoom covers the entire viewport, including resizing and zoom easing. Build, 14 scene/camera tests and actual desktop/portrait browser interactions passed; see [zoom validation](validation/2026-10-24-general-wheel-zoom.md).

- The update includes route-aware client movement, separate 5Hz movement/social timing, the accelerated town clock, calmer stays, indoor portrait pins, revised dock/clock controls and compressed/preloaded Home art. [Town timing](decisions/proposed-town-timing.md) remains Proposed; implemented preview defaults are not consensus ADRs.

- Earlier local frontend guest preview connected to the user-supplied shared database; Live / 12 mirrors and authored map rendering were checked at that time. Fixed comma-containing map asset URLs for Vite. See [shared preview validation](validation/2026-10-24-shared-frontend-preview.md); current connectivity is described above.
- Login email focus no longer draws a second inner frame; local desktop/mobile-width checks, build and auth tests passed. See [focus validation](validation/2026-10-24-login-focus.md).
- The application includes the Figma entry screen, SpacetimeAuth accounts and separate guest sessions, conversation diaries, visible interest and mutually unlocked contacts.
- The authored town and Home scenes are integrated into the web client, including General/Follow cameras and furniture hotspots. Original Godot scenes and assets remain available for editing.
- Import fidelity Parts A/B and own-lines CSV extraction are included. Sources and remaining live checks are in [project structure](state/project-structure.md) and [teammate validation records](validation/README.md).
- Existing teammate validation describes their machine and commit context. Checks executed on this machine for this merge are listed separately in [merge validation](validation/2026-10-24-merge-yw-map-assets.md).

## Navigation

- [Consensus ADRs](decisions/README.md#accepted) and [personal Proposed ideas](decisions/README.md#proposed) remain separate. Only Proposed describes ideas still being considered; implementation work does not change that distinction.
- [Team principles](core/principles.md), [discussion context](core/discussion-context.md), [authored Godot town](../mirrorvile/Town%20map.tscn), [Home](../mirrorvile/Home.tscn).
- [Original product requirements](design/mirrorville-product-workflow.md), [merge history](library/history/2026-10-24-before-code-merge.md), [handoff](HANDOFF.md).

## Remaining work from the source branch

- Email entry is duplicated between the app and hosted authentication; login_hint did not prefill the hosted field in the local read-only check. A single-entry send-link flow is requested but no replacement has been selected or implemented. See [investigation](validation/2026-10-24-email-login-investigation.md).
- Public simulation deployment (0007) and Maincloud model-call verification remain outstanding.
- The source branch lists Claude judgment-path validation, cross-browser/expiry and phone login checks, and subjective fidelity acceptance as remaining checks; see its individual validation records for exact scope.
- The teammate's postcard-privacy and CREAO briefs remain on `yw/proposals`. The seven yq proposals remain Proposed. Newly imported unnumbered proposals are not converted into ADRs by this merge.
- This operation downloads and merges code locally. No database publication, data migration, tunnel creation or public deployment is part of this operation.

## Teammate login/map repair

Integrated yq 7c7f5e6 into yw/map-assets: comma-containing asset filenames now load correctly
through local Vite, and desktop email placement/focus follow the teammate's repair. Their
original evidence is in validation/2026-10-24-login-focus.md and
validation/2026-10-24-shared-frontend-preview.md. Hosted login may still require a second
email entry; see validation/2026-10-24-email-login-investigation.md.
