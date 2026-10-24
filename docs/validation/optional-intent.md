# Optional intent

Date: 2026-10-24. Branch: `yw/diary`.

Today's intent is optional at creation and may be cleared through the update reducer. Empty or whitespace-only input is stored as an empty string; the existing world mapping defaults to Park. No intent is invented. The 300-character limit remains, as do name and TIPI requirements. Evidence rules and principles are unchanged.

| Check | Result |
| --- | --- |
| Client production build | Pass: `npm.cmd run build`. |
| Server build and local update | Pass: published `mirrorville` with `--delete-data=never`; regenerated bindings (no wire schema change). |
| Empty form intent | Pass: browser completed name and ten TIPI answers, kept intent empty, observed enabled Send my mirror in button and optional label. Closed without submission. |
| Server accepts empty and whitespace intent validation | Pass: called deployed create reducer with each value and intentionally invalid TIPI. Both advanced to the TIPI validation error instead of rejecting intent; transactions inserted no rows. |
| Overlong intent | Pass: deployed reducer rejected 301 characters with the 300-character limit error. |
| Successful creation and clearing an existing intent end to end | Pending: not exercised against persisted user mirrors. |

Screenshot: [optional intent and enabled submit](optional-intent.png).
