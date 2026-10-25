# Independent background observation — 2026-10-25

## Acceptance

- Source-role Electron acceptance: a short-lived headless client enabled the service and exited.
  The same independent background PID subsequently completed a real DeepSeek summary from synthetic
  source data. The driver had zero BrowserWindows, and there were no town delivery receipts.
  Evidence: desktop-application/background-source-acceptance.json.
- Packaged-role acceptance repeated that sequence using win-unpacked/Mirrorville.exe and its bundled
  Python helper/Node model client. Again the summary timestamp is after client exit, with no town
  import. Initial packaged output copied a raw synthetic window title; that led to the new rewrite
  and native-save guard. Final guard acceptance is recorded below after the final build.
- Restart of the source service restored its encrypted private configuration and stayed paused after
  explicit Quit. Evidence: desktop-application/background-restart-acceptance.json.
- No user activity was uploaded during QA. Synthetic inputs live only in ignored private-imports
  directories. No public resident, profile/card write or actual Windows startup entry was created.
- Local IPC tests cover nonce/payload HMAC validation in both directions, incorrect capability,
  rejected operations, UTF-8/Chinese preservation and successive ephemeral town clients.
- Engine tests cover completion without a town client, pause/scope invalidation, model throttling,
  no account credentials and no reducer/import calls. Town tests cover owned-target subscription
  gates, synchronization while sampling is paused, processing-import gates and unmount cancellation.
- Batch tests cover narrative-only ai_summary payloads, deterministic source fingerprints and recovery
  of accepted-but-unrecorded handoff without duplicate imports. Existing owner checks remain server-side.
- Browser fixture uses real components/styles with synthetic data. It shows one background switch,
  consolidated settings, startup/browser options initially off, the paused/observing transition and
  prepared-summary count. No pairing, evidence expansion or individual conversation selection.
  Evidence: desktop-application/background-observation-preview.png.

## Checks and scope

Final packaged acceptance after the reboot passed: the same no-window service completed a real
provider summary after its enabling client exited. The accepted narrative contains neither complete
synthetic source title/message nor executable names; no town delivery occurred. The QA service was
explicitly stopped afterward. Evidence: desktop-application/background-packaged-acceptance.json.
Installer and portable SHA-256 hashes: desktop-application/background-artifacts.json.

The 45 relevant Node tests passed again after reboot. The earlier full run was 236 tests total,
234 passed and the two unrelated first-meeting failures described below. No full-suite success claim.
The existing local database directory and signing keys were reused when restoring its service;
no database reset, schema change or new publication was needed after reboot.

Python suite passed 21/21 after adding native source-copy rejection. Relevant Node engine/transport,
client, native entry, activity and import tests passed; final counts below. Frontend/model-client
TypeScript checks and desktop builds pass. The additive local publish updates only the narrative
source-copy rewrite/guard, with --delete-data=never and no schema migration. Cloud unchanged.

The full suite found two unrelated first-meeting harness failures in scripts/test-first-meeting.mjs:
its advance helper cannot find tour-next after the separately modified diary step. That harness loads
CreateMirror and stubs SourceOffering rather than this activity panel/controller. Neither CreateMirror,
TourDiary nor that test file is modified by this work. Do not report the whole suite as all green.

Current human-account town sync and actual Windows login startup remain manual acceptance cases.
The accepted-import receipt means handed to the asynchronous learning queue, not completed learning.
Existing local model/database service must be reachable; game UI need not remain open. QA roles are
stopped after tests. Old running user app is left intact; final build delivered separately.
