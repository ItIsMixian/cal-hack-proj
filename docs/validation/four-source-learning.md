# Four-source learning validation

Date: 2026-10-24. Scope: local source adapters and shared room paper. The owner's follow-up corrected
the first route from a manual Marglo package bridge to direct Mirrorville-native desktop observation.
Earlier package checks below remain evidence only for the secondary compatibility importer/exporter.

## Automated checks

The final combined command passed **57/57** tests:

```powershell
node --test scripts/test-source-offering.mjs scripts/test-github.mjs scripts/test-marglo-package.mjs scripts/test-desktop-observer.mjs scripts/test-first-meeting.mjs scripts/test-importers.mjs scripts/test-learning.mjs scripts/test-facebook.mjs
```

- Four source-flow tests cover route selection without fetch/submission, retained and separate
  manual drafts, external adapters closing on Back, exact provenance/date/facts handoff, and an
  explicit disabled-while-busy retry for restored letters.
- Seven GitHub tests cover input/host validation, ownership/actor filtering, exclusion of
  collaborator prose, bounded whole-item letters, fixed-host no-credential requests, deadline,
  rate-limit/error/cancel handling and editable explicit UI handoff.
- Four Marglo tests cover version/provenance/date/limit validation, contact redaction, mandatory
  owner review, undated context, whole-piece limits and clearing confirmation after edits.
- Existing first-meeting, importers, learning and optional Facebook regression tests pass.

The follow-up `scripts/test-desktop-observer.mjs` adds fixed-loopback/no-credential/no-redirect
request checks, health/session/status/observation validation, explicit authorization failures,
size/deadline/cancellation handling, paused pairing, explicit capture and review, re-redacted handoff,
explicit clear/disconnect, and stable-ID review isolation across candidate insertion/reordering.
The primary chooser now opens `DesktopObservationOffering.tsx`; it never asks for an export file.
All seven desktop-frontend checks are part of the 57 passing tests above. The collector worker ran
`python desktop/test_observer.py`: **7/7 passed**, and independent reviewer security checks passed
**7/7**, using synthetic native observations/HTTP sessions rather than the owner's live desktop.

The Marglo worker also ran `python scripts/test-marglo-exporter.py`: **5/5 passed** for synthetic
SQLite read-only/no-mutation behavior, time bounds, metadata aggregation, context opt-in and private
field exclusion. After a strict UTC-date/path-filter follow-up it reran both its four Node tests and
five Python tests successfully.

`npm.cmd run build` passed TypeScript and production bundling. Vite reports its chunk-size advisory
for the main JS chunk; no build errors. No backend schema/reducer/generated bindings changed and no
publication was required for these adapters.

## Live read-only checks

- The GitHub worker called the actual adapter for the neutral public account `octocat`: six project
  background pieces and zero eligible recent activities. No mirror import or account mutation.
- The parent generated a real metadata-only Marglo package under `output/private-imports/` with one
  tentative piece, then an explicit context-opt-in package with three pieces. Contents were not
  printed or sent to the database/model; the output directory is gitignored. Source remains opened
  read-only by the exporter. This proves the local bridge against the existing store, not continuous
  observation or factual correctness of a derived interpretation.
- Parent browser smoke reached the real shared desk chooser and loaded the metadata-only Marglo
  package into the local preview: item/date shown, unchecked by default and handoff disabled before
  review. A CSS visibility issue hiding guidance/details was found and corrected with source-scoped
  specificity. Final browser recheck confirmed review guidance, package-generation versus item
  dates, export instructions and exact-letter disclosure are visible. GitHub shows its username,
  explicit ownership declaration and disabled read action before declaration. Returning from both
  adapters restores the four-source chooser. No handoff was clicked.
  Screenshot: [shared desk sources](four-source-learning/desk-sources.png), captured on the actual
  local room at the browser's default desktop viewport. Mobile/device acceptance remains untested.

The above manual-package smoke predates the owner's correction. Native desktop acceptance requires
the independent helper to run paused, real browser health/discovery, and synthetic authenticated
HTTP/capture tests; real capture must not be claimed based only on package-preview evidence.

The parent's attempted native helper launch through Windows `Start-Process` was rejected by
automatic approval review with the stated reason `blocked by policy`. The launch was not retried
through an alternate mechanism. Subsequently the owner manually started the helper; their
screenshot showed paused status, and the parent verified actual `GET /health` with explicit
localhost Origin returned HTTP 200, `mirrorville-desktop`, version 1. No agent pairing or capture
was performed. Thus user-started live helper health is verified, while real pairing/capture,
browser-to-loopback authorization and observation interpretation remain Pending. The synthetic
tests and production build do not establish these remaining live outcomes.

Parent browser recheck on localhost confirmed **Observe my computer** replaces the package route.
Opening it shows local startup/pairing instructions. With no helper running, **Find my desktop
companion** displays a connection failure, without a paired/capturing success or fabricated clues.
Screenshot: [companion not running](desktop-observer/not-running.png). No native capture, pairing,
or cloud handoff was performed in this browser check.

## Remaining acceptance and limits

- No real user's Marglo/GitHub material was handed over to a mirror in this verification. Owner
  judgment of generated cards, repeated-import interpretation and friend-facing relevance remain
  human acceptance items.
- GitHub lookup is public and self-declared, not OAuth ownership verification; API rate limits and
  public activity coverage apply. Portfolio URLs are not crawled.
- Exported/app/context observations are clues. Selected context may include untagged third-party
  prose which the owner must remove. Redaction removes obvious identifiers, not all sensitive meaning.
- Source/date/status live in the text protocol, not new structured database columns. Creation's
  status label remains generic, while the letter preserves source/date headers. Backend provenance
  is owner-supplied rather than cryptographically attested.
- The native helper captures locally while explicitly enabled; browser candidate polling runs only
  while its source paper is open. Closing the browser does not pause opted-in native collection.
  Cloud handoff remains explicit; photo understanding and audio transcription are not implemented.
  Existing text/chat files and deliberate text work through the same own-update source.

Design: [four-source learning](../design/four-source-learning.md).
