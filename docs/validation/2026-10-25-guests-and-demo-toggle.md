# Duplicate resident, guest lifecycle and demo toggle

2026-10-25. Incremental update to mirrorville-yw9299-worlds; --delete-data=never.

- Confirmed the duplicate was mixian, not Ethan: protected #9 and distinct-owner #18.
  #18 was reversibly retired with publisher authorization from the user's cleanup request.
  #9 and historical profiles/cards/diaries remain intact; no name-based ownership merge.
- Guest connection tracking handles multiple tabs, 60-second reconnection grace, verified
  email persistence, private archival, and restoring auto-retired residents on verified claim.
  Legacy unknown owners stay untouched until authenticated state is observed.
- Added world-local Demo OFF/ON control, host/publisher-selected operator authorization,
  five-minute expiry, eight-second dwell and bounded real encounters. No teleporting and
  no changes to evidence checks, consent or daily good-fit marks.
- Main lobby operator assigned from the actual owner of protected mirror #9, not its name.
  Mode defaults OFF. Private worlds use their actual owner.

Checks: backend tsc, production frontend build, 252 Node regressions passed. Targeted tests
cover multi-tab expiry, reconnect, account persistence, claim restoration, unknown legacy
owners, host-only toggle, automatic expiry, no teleport and one encounter per world.
Live local two-owner switch replication and full multi-tab/60-second disconnect checks passed.
Actual browser toggled OFF → ON → OFF with distinct labels and filled/outlined styling;
left OFF. Production backend upgrade and assignment to #9 owner passed. Frontend release: Pending.

Private history is archived, not erased. Real email login and live model-generated demo
dialogue remain Pending. Model latency is not eliminated by the pacing switch.
