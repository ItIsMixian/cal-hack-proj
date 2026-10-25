# Current work

Current integration: `yw/map-assets` combines the saved local source/desktop/iPhone/appearance work
with `origin/yq` at `d85c3ed`. Both branches' room, resident-status, diary and input features are kept.
Current integration evidence is in [merge validation](validation/2026-10-25-yw-yq-merge.md).

Earlier `yq` runtime and merge notes are historical; see
[runtime validation](validation/2026-10-24-local-frontend-runtime.md) and
[prior integration](validation/2026-10-24-update-yw-map-assets.md).

## Current implementation

- Diary now shows only summaries created after the previous close, with persistent per-identity/per-mirror cutoffs and a matching new-content dot. Both Diary entrances share this behavior; first use shows existing notes. 37 diary tests, 3 Home tests and build passed. See [last-close behavior and browser-local limits](validation/2026-10-24-diary-comments.md#since-the-previous-close-2026-10-24).

- Building resident tags now open Status cards with name, current activity/location and recent exchanges limited to the user's own mirrors and that resident. The default is the latest 5 exchanges active within 7 days, using source-content highlights with optional transcript expansion. Build, 7 tests and desktop/portrait actual tag-click fixture checks passed; see [Status card validation](validation/2026-10-24-resident-status-card.md).

Guest-to-account transfer and reversible resident management are implemented; see
`validation/guest-account-transfer.md`. Account-based cleanup retains Yiqiao Liu #12 and mixian #9
in town; guest/test data remains archived. Real email transfer acceptance is pending.

Phone entry layout, compressed production sharing and the current tunnel's exact auth callbacks
were repaired after phone feedback; see `validation/mobile-login-and-share-performance.md`.

- Diary now displays one concise chat summary per merged visit, capped at two sentences / 50 words / 280 characters, filtering common actions, scene narration and AI decisions from old notes. Name/time/place grouping and interest/contact controls remain. Build, backend typecheck and 30 diary tests passed. The stricter generation prompt and model-failure fallback remain unpublished; see [current validation and heuristic limits](validation/2026-10-24-diary-comments.md#concise-chat-only-summary-2026-10-24).

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
