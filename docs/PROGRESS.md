# Current work

Updated 2026-10-24. The teammate's application code from `origin/yw/map-assets` (`cd9a1910b23b42a05ee98106fce606e311f59c42`) is being merged into local `yq`, starting at `1f404a9ba67b52ee594c2b0018dbe35449717c81`. The user's authored Godot project remains in `mirrorvile/`.

## Current implementation

- The application includes the Figma entry screen, SpacetimeAuth accounts and separate guest sessions, conversation diaries, visible interest and mutually unlocked contacts.
- The authored town and Home scenes are integrated into the web client, including General/Follow cameras and furniture hotspots. Original Godot scenes and assets remain available for editing.
- Import fidelity Parts A/B and own-lines CSV extraction are included. Sources and remaining live checks are in [project structure](state/project-structure.md) and [teammate validation records](validation/README.md).
- Existing teammate validation describes their machine and commit context. Checks executed on this machine for this merge are listed separately in [merge validation](validation/2026-10-24-merge-yw-map-assets.md).

## Navigation

- [Consensus ADRs](decisions/README.md#accepted) and [personal Proposed ideas](decisions/README.md#proposed) remain separate. Only Proposed describes ideas still being considered; implementation work does not change that distinction.
- [Team principles](core/principles.md), [discussion context](core/discussion-context.md), [authored Godot town](../mirrorvile/Town%20map.tscn), [Home](../mirrorvile/Home.tscn).
- [Original product requirements](design/mirrorville-product-workflow.md), [merge history](library/history/2026-10-24-before-code-merge.md), [handoff](HANDOFF.md).

## Remaining work from the source branch

- Public simulation deployment (0007) and Maincloud model-call verification remain outstanding.
- The source branch lists Claude judgment-path validation, cross-browser/expiry and phone login checks, and subjective fidelity acceptance as remaining checks; see its individual validation records for exact scope.
- The teammate's postcard-privacy and CREAO briefs remain on `yw/proposals`. The seven yq proposals remain Proposed. Newly imported unnumbered proposals are not converted into ADRs by this merge.
- This operation downloads and merges code locally. No database publication, data migration, tunnel creation or public deployment is part of this operation.
