# Proposed: keep the guest mirror when signing in

Status: Proposed for teammate review (2026-10-24). Implemented at the user's explicit request.

## Context and choice

Guest and email sessions have separate identities. Signing in previously left the guest mirror
behind and encouraged creating another mirror with the same name. The user chose transfer of the
original mirror into the email account over removing guest creation or pausing guests on exit.

Before account sign-in, the browser authenticates as its saved guest and prepares a private,
random 256-bit capability, valid for 24 hours. After verified SpacetimeAuth email sign-in, a single
transaction moves that guest's captured mirrors and their private ownership references. IDs,
cards, diaries, relationships and contacts remain intact. Claim is single-account and retry-safe.
Guest credentials remain separate; account credentials never replace them. Signing in from a
browser with a saved guest credential includes this transfer; no name-based identity inference.

Existing same-name mirrors remain separate. Their owner can reversibly move either out of town
and bring it back through Residents. New creation rejects a same-name mirror already owned by
the caller, including archived mirrors. Different people may share a name.

## Consequences

This extends the guest/account boundary in `proposed-spacetimeauth-entry.md`. The claim is allowed
to exceed the normal creation quota so retaining existing data never requires deletion; subsequent
creation still observes the quota. Guest exit alone still preserves the browser-owned mirror.
Losing that browser's guest credential cannot be repaired using a name. A different origin has
separate browser storage. Real email callback acceptance remains a manual check.

Evidence: [validation](../validation/guest-account-transfer.md).
