# Background observation lifecycle

## One product, separate process lifetimes

Normal main.mjs serves the same bundled town UI/origin and handles system-browser login. Its native
facade now proxies AgentClient, not a child sampler. Closing town calls AgentClient.stop(), a no-op
for the service. The normal process has no tray, avoiding two icons. Minimized town remains available
through the same service tray; closing town actually releases its renderer.

The --background-agent role sets a separate background-agent userData before acquiring its own
single-instance lock. No BrowserWindow is created. It owns one private-stdio native helper, one
ReportEngine timer and one Mirrorville tray. Opening the tray starts/focuses the normal town role.
The service and town use the original observer DB/account storage; no new game DB or account is made.

Start/pause is in the room's single near-term-notes panel. It enables capture and model work together.
Codex inclusion, browser-title inclusion, optional Windows login startup and clear are consolidated
under its one settings disclosure. No raw evidence or conversation checklist returns. Browser topics
remain off by default. Closing town continues enabled work. Explicit service Quit persists disabled
capture/model settings, stops the helper and leaves subsequent startup paused. Normal service restart
restores already authorized capture. Capture expiry renews only if that persistent flag remains on.
Sign-out still pauses capture before changing human identity.

## Authenticated local boundary

The service root is userData/background-agent. Windows ACL permits the current OS user, SYSTEM and
administrators; linked/outside directories are rejected before permissions change. The local pipe name
is derived from that per-user root. The server does not open a new TCP/HTTP listener. Request and response
HMACs authenticate a random nonce and payload; wrong keys/operations are dropped. Requests/responses
are bounded and parsed as UTF-8 across chunk boundaries. Renderer access still requires the trusted
local app main frame, sandbox/context isolation and the policy allowlist. No generic shell/file API.

Only the random IPC capability is shared in an ACL-protected key.hex. Human account credentials are
never given to the service. State/model identity token are safeStorage-encrypted in the agent's own
Electron profile. safeStorage keys are profile-specific, so the town does not attempt to decrypt
agent state. A previous QA iteration exposed this profile separation; owner-only capability/HMAC
transport resolves it without copying account tokens or weakening either process sandbox.

Model endpoint/database come from explicit public build settings, not renderer arguments or temporary
.env tunnels. Active scopes must match those build settings. A normal start requires current owner
scope and a selected owned profile; cached own background is at most 3,000 characters. It is supplied
as model input data, not code. Clear also removes cached background/target/scope. Native storage stays
in the already ACL-protected observer directory.

## Independent period summaries

ReportEngine operates on local hourly periods through native dailyReports/dailyContext. It samples
existing source context, calls the same understandActivity procedure in period-report mode and saves
one narrative with its source hash. It never calls importWriting, reads other profiles or receives
an OIDC/SpacetimeDB human account token. The persistent anonymous service identity is used only for
model quota/calls; mirrorId is always undefined. Its token is encrypted, not returned over IPC.

The scheduler runs in the no-window process, checks locally every 5 seconds and throttles actual
completed/failed model work to 15 minutes; unchanged/sparse periods don't cause repeated calls.
Explicit pause, source changes, owner changes, clear and helper failure invalidate in-flight results.
Capture and model service failures don't create fabricated summaries. A source hash and generation
check prevent cleared/stale inputs from being saved.

The provider must paraphrase source text. A full raw title/long owner-message copy or .exe process
name triggers one server-side rewrite; a second copy fails instead of becoming material. Native save
also enforces this boundary. The semantic correctness of a narrative still depends on the model;
this source-copy check is not a proof of truth.

## Return to town

useActivityLearning now only synchronizes stored reports. It waits for identity and both owned-mirror
and import-status subscriptions. The configured scope/target must match an active owned mirror.
A processing import gates another batch. Up to 24 pending narratives are submitted chronologically
as one ai_summary letter; raw evidence never enters the letter. A SHA-256 source fingerprint and
existing owner-only import statuses recover a lost native receipt without duplicating the reducer.
Native receipts record accepted handoff, not proof that asynchronous card learning has completed.
Existing import failure/status UI remains authoritative for that later stage.

A quiet pending count and handed-over state appear inside the same room. There is no import-file
ritual, notification popup or independent collector login. Manual summarize-now schedules the service;
it does not put model work back in the renderer. Existing card sharing/privacy and voice-learning
restrictions remain unchanged.

## Packaging and limits

build-desktop.mjs produces explicit runtime-config.json and a Node-target model-client.cjs bundle.
Both are included in the one desktop artifact; the model client TypeScript and QA driver are excluded.
Python/runtime remains bundled. --background-smoke uses a dedicated temporary profile, no native
sampling/tray/startup changes, and synthetic source records only. No production credential or source
DB is copied into QA artifacts.

The prototype's external local SpacetimeDB service must still be running for model calls and town
sync. The game window can be closed. Network/backend absence retains local source data for retry.
Windows login startup is opt-in; actual OS startup registration is not changed by acceptance tests.
Close the old desktop version before opening the new build to release its old single-instance lock.
No website/cloud deployment or shared backend schema change is needed for the process separation.
