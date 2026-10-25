# Current work

Updated 2026-10-24. The latest teammate code from `origin/yw/map-assets` (`7509d4ba95dd383d6b0befee23c84d6246383b69`) is being merged into local `yq`, starting at `7c7f5e61c9f02283c8eb1f1ff3ad5e2539ee41b9`. The original Godot project and local login/map repairs are retained. Local checks are recorded in [update validation](validation/2026-10-24-update-yw-map-assets.md).

## Current implementation

- The update includes route-aware client movement, separate 5Hz movement/social timing, the accelerated town clock, calmer stays, indoor portrait pins, revised dock/clock controls and compressed/preloaded Home art. [Town timing](decisions/proposed-town-timing.md) remains Proposed; implemented preview defaults are not consensus ADRs.

- Local frontend guest preview connects to the user-supplied shared database; Live / 12 mirrors and authored map rendering checked. Fixed comma-containing map asset URLs for Vite. See [shared preview validation](validation/2026-10-24-shared-frontend-preview.md).
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
