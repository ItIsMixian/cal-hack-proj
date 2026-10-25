# Daily diary and real-time pacing — 2026-10-25

## Implemented locally

- Diary groups retained records by mirror and real venue date, opens an unread page when available, and offers Earlier/Later navigation. Pages contain chronological meetings and the existing bounded chat summaries. Exact times are collapsed under Time and source; interest/contact controls remain.
- Social scheduling caps starts at 3 per resident per rolling 24 hours and 1 per pair per 24 hours; conversations have 4 or 6 utterance ceilings. The town clock does not change these limits.
- Private conversation_material ledger rejects unchanged material, reordering and removal-only changes. The speaking prompt explicitly forbids turning old/undated human facts into today's events.

## Verification

- 207 Node tests passed across scripts/test-*.mjs. Includes actual tick callback checks for first opportunity, unchanged material after 25 hours, new shareable material, pair cooldown; private ledger schema check; daily UI grouping, midnight boundary, retention, ownership and interest privacy tests.
- The previous scheduler failure was in the fake DB update return value (Map rather than updated row), fixed in the test fixture to match the SDK.
- Backend TypeScript check and production frontend build passed; existing bundle-size advisory remains.
- SpacetimeDB 2.13 CLI build/generate completed before reboot. Private table excluded from client accessors; generated types retained. No publish performed.
- Browser fixture with synthetic entries: Oct 25 page showed two chronological meetings; Earlier opened Oct 24; Later returned to Oct 25. Screenshot: room-tour/daily-diary.png. No real model call or interest submission.
- Vite restarted hidden on 127.0.0.1:5173 after reboot. Database/tunnel/collector were not restarted.

## Boundaries

Not deployed: the live simulation still uses its previously published rules. No 24-hour live soak, real model-output evaluation, or mobile diary smoke test was performed. Calendar grouping uses venue time rather than browser timezone. Existing close markers still mark the current scope on close, not each page individually.

Text novelty is not semantic novelty. Initial ledger marks all available material as considered at start; it is conservative and does not implement open-question continuation, relevant-person routing or separate friend/stranger policy. See ../decisions/proposed-diary-real-time.md.


## Local connection recovery after reboot

The user's real localhost page could not reach ws://localhost:3000: only Vite was running.
Restarted SpacetimeDB 2.13 on loopback port 3000 using the original documented data directory
and its existing JWT key files. No reset, module publish, or identity change. Retried the user's
Edge tab through its Try again control and verified the town page loaded.


Publication follow-up: on 2026-10-25, the local `mirrorville` module was republished with
`--delete-data=never` for activity understanding. This also added the previously pending private
`conversation_material` table. No cloud publication or data reset. See activity understanding
validation for the additive migration record.
