Current lifecycle is superseded by [independent background observation](background-observation.md).
Capture/model work no longer belongs to the town window; earlier close-stops-helper notes are historical.

Current UI and material behavior are defined by the time-period extension below. Earlier
checklist/evidence/individual-conversation-review sections describe the superseded UI.

# Desktop activity -> context -> Mirror

## Data flow

1. User starts observation in the desktop source. Native capture now requests title context;
   the standalone web companion keeps its existing restricted mode.
2. Win32 reads foreground app/title, idle and lock state. Mirrorville and system/terminal windows
   are excluded; sensitive titles/apps are rejected. Browser titles require their separate option.
3. `desktop/activity_memory.py` reduces URLs to hosts, masks paths/contact details and caps titles
   at 200 characters. Filtering is heuristic, not a guarantee of semantic anonymization. No app body,
   screenshot, keystroke, clipboard or hidden conversation history is read.
4. Consecutive equal app/title contexts become an episode. Idle, pauses, locked windows and long
   gaps break continuity. Episode IDs, reduced title, app, start/end and active duration are local.
5. The source previews up to 40 new episodes. Manual Ask or explicit automatic-understanding consent
   allows those reduced titles, dates/durations, confirmed local context/corrections and the selected
   owned mirror's existing profile to reach the configured DeepSeek model via the local game server.
6. The model proposes up to five context updates. Each must cite actual episode IDs and an exact
   title substring. No sufficient topic -> an empty result, not a made-up update.
7. The native helper stores the update and embedded evidence locally as a draft. The owner can
   inspect evidence, correct, confirm or dismiss it. Confirmed/dismissed local context feeds later
   model requests; unconfirmed model text is not treated as established background.
8. Bring this update to my mirror is available only after confirmation. It creates a reviewed
   facts letter through the existing SourceOffering/importWriting flow. Sharing controls, provenance,
   recency and redaction continue to apply. This does not infer voice or promise anything for humans.

## Storage and identity

Existing private `observer/observations.db` adds `activity_episodes`, `activity_seen` and
`activity_memories`. Original app-only observations are preserved. Episodes retain seven days,
at most 2,000 contexts. Read snapshots cap the recent episode list at 60. Drafts expire after
30 days and retain at most 120 recent draft rows. Explicit confirmations and dismissals persist
until the owner clears local activity/memory. UI recall combines the latest 20 notes with up to 10 stable confirmed/dismissed notes and at most
three supporting episodes per note; the stored evidence preserves the original reference set.

Local notes and seen checkpoints are scoped by database host/name plus authenticated identity.
An in-flight model result is discarded on identity/consent change; clear/correction increments a
generation counter so an older result cannot overwrite the owner's new memory state. Guest and
account scopes are not silently merged. The OS user owns local activity evidence; separate Windows
users remain separated by their userData folder/ACLs.

The server does not persist submitted titles or model themes. Its only added table is private
`activity_budget` (identity, day, count, last call). It authenticates selected mirror ownership using
`ctx.sender`, checks again after model HTTP and caps calls at 50/venue-day with a 30-second minimum
gap. Invalid/unreferenced evidence fails without writing cards/profile. This exact-substring check
proves traceability, not semantic correctness; drafts still require owner judgment.

## Background behavior

`useActivityLearning` stays mounted in App through town and room navigation. With automatic
understanding enabled, active title capture and new unseen episodes, it attempts a batch at most
once every two minutes. Native minimize does not unmount App; Chromium may throttle hidden timers.
No new episodes -> no model call. Failed requests retain unseen evidence. Successful empty results
mark the batch seen and explain that there was insufficient context. Capture pause stops new samples;
disable automatic understanding to revoke future model requests. Sign-out pauses capture and removes
the controller. Every app restart starts capture paused; saved model consent is identity-scoped.

The model receives the existing profile only when an owned mirror is selected; before first mirror
creation, it can still summarize the user's episodes and confirmed local memory. Existing rooms
pass the mirror ID into the same source panel. UI shows a contextual update and evidence, rather
than a primary list of executable-usage records.

## Transport / implementation

- `native_host.py`: explicit contextTitles capture flag; context / saveUnderstanding /
  reviseUnderstanding commands over private stdio, fixed shape validation in the main process.
- UTF-8 is explicit on both native stdin/stdout, including Chinese Windows. JSON is bounded;
  no generic file/shell/network command is exposed.
- `activityMemory.ts`: response validation, per-identity config, deduplicated work and stale-result
  guards. `ActivityUnderstandingPanel.tsx`: preview, manual/automatic consent, evidence and correction.
- `spacetimedb/src/activity.ts`: input/model grounding rules; `understandActivity`: provider call,
  owner checks and limits. API/model secrets remain in the existing server configuration.

This is title-based contextual interpretation. Generic or misleading titles remain an information
limit. It does not read specified-app visible bodies, take screenshots, or implement browser URL
extensions; browser page titles provide the current webpage topic channel.


## Codex owner-message source (2026-10-25 extension)

`codex_source.py` discovers recent non-archived human chats via read-only state_5.sqlite in
CODEX_HOME (fallback ~/.codex). Renderer receives sanitized labels and opaque IDs, never paths.
Only indexed rollouts resolved beneath sessions/ are eligible. `codexSources` lists and
`codexSelect` connects up to 10 known IDs. The private helper keeps selection in RAM; every restart
requires selecting sources again. Start/Pause controls both sources. Clear removes excerpts,
source references and notes and disconnects Codex sources. Disconnect alone preserves prior evidence.

While enabled, poll every 10 seconds, two selected sources per poll. Initial reads cover a bounded
64 MB tail; subsequent reads resume at complete JSONL record offsets. Up to 12,000 records/read,
1 MB/record, recent 7 days, last 160 excerpts/import; all activity retains the existing 2,000 cap.
Only response_item/message role=user input_text is parsed, with human provenance required when
metadata exists. Tool/event duplicates, assistant replies, app wrappers, file attachments, system
instructions, code blocks and obvious credentials are excluded. Contact/path/URL masking remains
heuristic. Each message contributes up to 800 characters in independently cited 200-character
excerpts. Truncation and filtering can omit meaningful context; this is not a full conversation export.

Stable source-message IDs deduplicate rereads; partial lines retry next poll. activity_sources maps
episode IDs to a local source thread ID/label, and evidence keeps that source when saved into notes.
Wire-compatible episodes use app="Codex conversation" and title=owner excerpt. seconds=1 is a
transport placeholder, never displayed as dwell and explicitly explained to the model. No database
schema or generated-wire binding change is needed. The source text itself remains in local memory;
manual Ask or renewed opt-in sends selected excerpts through understandActivity to DeepSeek.
Changing selected conversations disables automatic learning and invalidates in-flight result saves.

This source supports current Codex local rollout/index formats, not cloud-only chat bodies,
screen reading, arbitrary app content or browser page bodies. The model must distinguish a human
request/plan from a report of completed work. Owner review and explicit handoff remain required.


## Time-period narrative materials (2026-10-25, supersedes checklist UI)

Marglo's actual daily_summary.py compresses representative day episodes and owner replies into a
150–300-character second-person narrative, rather than showing window-title logs. Its reporter.py
also explicitly avoids dumping original titles. Mirrorville adapts that narrative unit to hourly
local-time periods, including UTC offset in each period key for repeated DST hours. Windows that
span an hour boundary are split proportionally so dwell is not all attributed to the final hour.
Codex message time is an event, never dwell. Each period samples up to 40 representative inputs,
balancing owner messages and window activity when both are available. Sparse periods may be short
or return empty; unchanged empty periods are checkpointed locally so they cannot starve older work.

The source UI shows only timestamped narrative summaries with previous/next navigation. It has no
raw source preview, original-evidence expansion, fact confirmation loop or conversation checklist.
A single start action connects up to ten recent supported local Codex human chats, starts native
observation and enables model summarization/automatic handoff for the selected owner Mirror.
Codex source inclusion remains a setting; its preference persists in SQLite across app restarts,
while capture still starts paused. Raw owner messages remain subject to existing filters/caps.

The native daily_reports.py name and daily* private-IPC command names are retained internally, but
keys are hour periods, not whole days. daily_reports and daily_deliveries are local tables scoped
by host/database/owner identity. They retain up to 168 narrative periods per owner; delivery receipts
are keyed by period and mirror ID with input hash. Clear removes reports, receipts and source settings.
Saved source hashes detect new content; existing-period narrative is replaced instead of appended.
Raw title/excerpt evidence is used only by the summarizer/internal grounding check. It is never
included in the material imported into the town. Snapshot/UI responses contain narratives and
period metadata; model inputs are obtained separately through dailyContext.

The existing understandActivity procedure selects a narrative prompt for period-report mode,
maintaining owner checks, private rate budgets and exact internal evidence references. Signature
and database schema do not change. Prompt requests 50–300 Chinese characters, at most 400; plans
and requests must not become completed progress. Earlier summaries provide continuity, not new
current-period events. The provider still sees reduced input when processing is enabled; this
is not an offline language model. No Marglo personal database, persona or memoir is copied.

useActivityLearning now drives this period loop, using a fresh period-report consent key rather
than reusing old title-only consent. It checks locally every 30 seconds and throttles completed
or failed model work to 15 minutes. No new input means no provider call. Manual summarize-now is
available. After a summary is saved, authorized handoff submits only [period] + narrative through
importWriting as ai_summary/relation other; this cannot train voice. Reducer acceptance gets a local
receipt; failure remains retryable. An accepted import is queued work, not proof that all learning
has completed. Clearing/changing source/capture invalidates pending saves. Automatic handoff
checks capture/consent again before sending. It does not auto-enable public personal cards.

This build is delivered in output/desktop-release-periods so the current running old app is left
intact. Quit the old instance before manually opening the new one; both use the existing local game
database and original desktop account storage. Daily aggregate views and adaptive topic boundaries
are not implemented; hourly grouping is the shipped default.
