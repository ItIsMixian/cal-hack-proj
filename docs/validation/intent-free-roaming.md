# Intent-free roaming

2026-10-24, `yw/diary`.

## Diagnosis

The live `mixian` row had empty intent, Park as its home/place, no active conversation, and identical position/target coordinates. It was the only mirror in Park at the inspection. The previous selector applied an 80% home preference even to blank intent, turning the initial default Park spawn into a persistent preference. Social initiation requires the same place and proximity, so isolation made conversation unlikely. The scheduler and other mirrors were active.

## Change

Keep existing event attraction and lingering. On its next destination selection, an intent-free mirror samples a place occupied by another mirror not currently walking. If no such mirror exists, it explores any landmark. Explicit intent keeps its existing home preference. This neither assigns an intent nor forces conversation, interest, or matches. No table or API changes, and no changes to 0004 or principles.

| Check | Result |
| --- | --- |
| Actual selector regression tests | Pass: `npm.cmd run test:roaming`, six tests: blank, whitespace, excluding self/travelers, solo exploration, explicit intent and daily events. Uses actual selector/helper source. |
| Existing diary/privacy/evidence tests | Pass: `npm.cmd run test:diary`, all ten. |
| Module build, publish and bindings | Pass: local `mirrorville` updated with `--delete-data=never`; bindings regenerated with no API changes. |
| Live behavior | Pass: subsequent SQL snapshot showed `mixian`, intent `""`, destination `cafe`, activity `walking`, position `(30.113747, 22.014202)` and target `(17.24123, 6.059671)`. No manual teleport or user-row edit used. |
| New conversation and diary after this change | Pending: conversation remains probabilistic and proximity/cooldown gated. |
| Long-run destination balance and first-conversation timing | Pending. |

The initial Park spawn from the optional-intent change remains; only subsequent default destination choice changes. Existing keys and user records are preserved.
