# Integrated worlds, desktop and cloud migration

Date: 2026-10-25. Candidate combines origin/yw/map-assets (8a58164), frozen local work,
yq bd16787 and the final familiar-dialogue/source-evidence patch. Main and the original
shared dirty checkout were not modified. Work was isolated in the attached integration checkout.

## Changes

- Room-first onboarding, world selection/departure, membership-scoped independent residents,
  current room interaction/diary, source import, learning and expression guidance coexist.
- Empty-room welcome uses the same room-stage container as owned rooms; this fixes exposed
  white hotspot buttons, misplaced actor and tiny door label. Desktop authored observation
  panel, errors and tray labels are English; user-created notes retain their original language.
- Desktop observation and background summary modules included. Cloud desktop build uses
  the same new database as the web build. Observation remains opt-in and disabled initially.
- Guest account claim carries world membership/ownership and the identity prototype;
  onboarding enforces selected-world membership and creates the stable prototype.
- Last feature: familiar-dialogue biography boundaries and server-attached diary excerpts.
  Source selection is checked against offered and still-shared exact source records, using
  the same venue visibility policy as current conversations, within the conversation world.
  Prompt constraints are not mechanical verification of every generated prose claim.

## Cloud migration

New Maincloud database: mirrorville-yw9299-worlds.
Identity: c200c401281a25d3f1f22f3dfc390e6e09cf393278ab86d303e9b267b0c7262b.
Published with --delete-data=never. Both local mirrorville and old cloud databases retained.
Publisher-only typed restore transaction preserves historical IDs, exact owner identities,
private data and auto-increment sequences. Subsequent restores reject a nonempty target.
Only the publisher can call this reducer. No raw rows, messages, contacts or credentials
were written to repository/validation output. Model keys were transferred in memory.

Restored and count-checked: 21 mirrors/profiles, 597 conversations, 4,284 lines, 80 relations,
1,144 diary entries, 8 interests, 89 cards, 8 summaries, 8 learning rows, 7 styles,
24 import statuses, 2 legacy encounters, 10 activity budgets. Protected mirror ID 9 retained.
Existing active conversation flags were closed on the target rather than copying stale
scheduled jobs. Current local simulation continues independently; this is a one-time copy,
not ongoing replication. Existing source guest tokens signed by the old local server are
not interchangeable with Maincloud tokens. Account owner identities are preserved; no
name-based reassignment was performed. Real email account recovery is Pending.

## Verification

- Backend typecheck and production web build: Passed.
- Focused integration tests: 64 passed; restored desktop understanding tests: 17 learning tests passed.
- Live isolated 3011 multiworld checks: Passed: private invites/capacity, scoped subscriptions,
  eight SQL privacy denials, independent resident creation, continued simulation off-view,
  reconnect and concurrent admission. Test database differs from the migrated cloud database.
- Live public discovery/admission tests against 3011: Passed.
- Windows desktop package built using the installed Electron distribution. Packaged smoke
  passed: native bridge present, Node hidden from renderer, malformed IPC rejected,
  observation disabled. This smoke intentionally does not collect real desktop activity.
- Browser: owned-room scene/actor/hotspots render together; no-mirror wrapper correction
  built successfully. Fresh no-mirror visual pass: Passed; the scene, actor and door label align without white hotspots.
- Full regression: 247 Node tests and 7 native Python tests passed. Exact row/owner comparisons passed for profiles, cards, summaries, learning, styles, diary and interest; anonymous cloud private SQL was denied.
- Desktop backend switch invalidates the old background guest token and pauses old-database capture without deleting saved notes.
- Pages deployment: Passed for 20e7689, GitHub Actions run 40197402448. Fixed URL:
  https://itismixian.github.io/cal-hack-proj/ . The production guest connected to Maincloud,
  entered the corrected empty room, opened the journey, selected Mirrorville and reached
  the migrated town. Initial room artwork loading failed once; the Retry action succeeded
  and all five image resources returned HTTP 200. Cold-load reliability remains a limitation.
- Live email login, fresh real model output and background collection across Windows
  restart: Pending. No one else was signed in or prompted for an email during this check.
