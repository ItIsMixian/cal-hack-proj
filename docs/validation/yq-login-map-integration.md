# Integrate yq login and map fixes

2026-10-24 · yw/map-assets. Source commit: 7c7f5e6 (Ethan Liu).

Owner authorized integrating the teammate's repair. Cherry-picked the specific fix commit,
retaining attribution. Code merged cleanly; DEVLOG/PROGRESS conflicts were resolved by retaining
current branch state and adding the repair/evidence notes, rather than replacing progress with
older yq state. Original teammate screenshots and validation remain attributed to their checks.

Included: literal commas in town asset URLs, literal filesystem paths and matching URI decoding
in the regression; lower desktop email/guidance and focus highlight on the artwork/native border.

| Check | Result |
| --- | --- |
| Production client typecheck/build | Pass |
| Complete regression suite | Pass (72 tests) |
| Current navigation/timing/room delivery/exit regressions retained | Pass |
| Principles and 0004 changes | None |
| Database publication/reset | Not needed; none performed |
| Desktop/phone visual acceptance | Pending (owner testing) |

User clarified that import-first flow and speaking-style calibration should be presented as
beginner onboarding. Those plans remain separate from this teammate UI repair integration.
