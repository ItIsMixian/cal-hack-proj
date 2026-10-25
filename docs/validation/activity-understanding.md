# Activity understanding delivery — 2026-10-25

Owner request: migrate Marglo's window-title -> episode memory -> contextual model interpretation
chain, rather than keep application-use counters. Current scope is the Windows desktop app and
the existing local database. No screenshots/app bodies/hidden chat histories are read.

## Implemented

- Reduced title capture behind the native contextTitles mode, retaining the default paused startup.
- Durable episodes and owner-scoped private draft/confirmed/dismissed memories in the protected
  observer SQLite file. Existing application-only records remain. Confirmed context is retained in
  recall even when many newer draft notes arrive.
- New owner-authenticated understandActivity procedure using the existing DeepSeek configuration.
  It combines evidence with confirmed local context/corrections and an optional owned mirror profile.
  Server input caps, exact source references/quotes and private per-identity limits are enforced.
- Manual model action plus an explicit automatic-private-understanding checkbox, default off.
  App-level controller remains mounted through room/town navigation, polls for active capture and
  new evidence, throttles model batches, and discards results after consent/identity changes.
- Contextual update UI: evidence, correction, confirmation, dismissal and confirmed facts-letter
  handoff. Local title moments are not automatically published as cards or used as voice samples.

## Local publication

Published to local mirrorville using the original configured publisher and `--delete-data=never`.
The migration added private activity_budget and the already pending conversation_material table.
A subsequent validation-only server adjustment published with an empty migration plan. Existing
residents, profiles, cards, stored model configuration and identities were not reset. Cloud is unchanged.
Generated client procedure/types bindings from the actual module.

## Verification

- Full Node suite after integration: 223/223 passed. Added background-controller consent/capture/
  throttle/unmount test passed separately. Subsequent targeted input, ownership and memory tests:
  24/24 passed. Frontend/backend TypeScript checks passed.
- Python: original observer 7/7, native pipe 3/3 and new activity-memory 4/4 passed. These cover title
  reduction, idle/gap handling, opt-in capture, restart persistence, identity scope, fabricated evidence,
  clear-versus-in-flight results and retention of confirmed background among newer drafts.
- Real foreground sampler check: rich title context is available on this machine. The actual user's
  title was not sent to the model as QA.
- Real local SDK/procedure -> configured DeepSeek request used synthetic activity. The model returned:
  “正在开发 Mirrorville 的桌面端迁移，涉及窗口标题事件与私有上下文理解功能。”
  It cited the provided title substring and episode ID. The response was saved in a dedicated test
  memory, corrected/confirmed, and successfully read after reopening SQLite. An initial empty model
  result was treated as insufficient evidence, not as a fabricated success.
- The real call exposed Windows console-codepage corruption when writing Chinese model results;
  explicit UTF-8 stdin/stdout and child runtime settings fix it. A bundled-helper subprocess test
  round-tripped a Chinese title/theme through saveUnderstanding/context with exact equality.
- Browser fixture used synthetic activity and the actual model response, with production room styles.
  Checked preview of model inputs -> understanding -> exact evidence -> owner correction -> confirmation
  -> reviewed gift callback. It did not mutate an existing owner mirror. Evidence:
  [understanding preview](desktop-application/activity-understanding-preview.png).
- No public test resident was created. Synthetic model calls only created their private per-identity
  budget rows. No actual user window activity was automatically uploaded during validation.

## Native delivery and practical limits

Both desktop artifacts are regenerated in output/desktop-release; the running local app is restarted
paused with original session storage. Helper retains local evidence; owner must Start observation
again and explicitly ask DeepSeek or enable automatic understanding. Cloud/website not deployed.

Generic or misleading titles can still yield no update. Exact evidence matching establishes a source
link, not semantic truth; owner confirmation remains necessary. A model may validly return no themes.
This phase does not add screenshots, specified-app visible text, a browser URL extension, automatic
sharing, or real-user voice learning. Real owner judgment of near-term update quality, prolonged
minimized use and real-activity handoff remain acceptance items; the mechanics above are verified.

The private source database and model-result QA files are under ignored output/private-imports and
are not included in application artifacts. Artifact file hashes are updated in
desktop-application/artifacts.json after final packaging.

Final packaging completed for installer and portable. Native app reopened with original session;
the new activity tables are present alongside retained legacy rows. The owner subsequently enabled
observation (native window status Observing this computer); no agent action enabled automatic
model processing. Both artifact hashes refreshed.


## Codex content extension acceptance (2026-10-25)

- Read-only live foreground inspection found generic ChatGPT title; real rich-memory count was 0.
- New importer read the selected current real chat into an isolated temporary local DB: 13 human
  excerpts with Marglo/Mirrorville context, in ~0.16 seconds. No actual excerpts sent to a model.
- Bundled PyInstaller helper private-pipe test found 23 selectable chats, selected this chat,
  started capture and produced the same 13 excerpts. Temporary QA DB removed after helper exit.
- Python suite 17/17 passed: selection, human provenance, AI/system/tool exclusion, credential
  filtering, source references, deduplication/restart, partial append, pause/resume, clear and path
  containment. Node targeted suite 35/35 passed, including IPC shape and existing activity loop.
- Frontend and backend typechecks and desktop UI/helper builds passed. Local backend prompt update
  published with --delete-data=never; no schema migration or cloud change.
- Real DeepSeek call used two synthetic owner messages through local understandActivity. Its cited
  result correctly said the requested conversation integration remained to be implemented, rather
  than asserting completion. Fixture evidence: desktop-application/codex-synthetic-model-result.json.
- Browser fixture with actual component verified a selected checkbox + Use these conversations
  changes the visible source count from 0 to 1 and leaves automatic learning disabled. A second
  fixture check enabled auto, disconnected the source, and visibly verified auto returned to off. This fixture
  contains synthetic source labels. Native human account selection/model review is not automated.


Delivery note: final desktop packaging uses electron-builder compression=store to include the
corrected capture-disclosure text in both artifacts. Automatic approval rejected the attempted
Start-Process application relaunch with only "blocked by policy"; no alternative launch bypass
was attempted. The desktop app therefore needs manual reopening. Native private-pipe ingestion
was verified separately against the bundled helper, as recorded above.
