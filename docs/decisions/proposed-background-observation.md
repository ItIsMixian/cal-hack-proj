# Background observation as part of Mirrorville

Status: owner-authorized implementation, 2026-10-25; unnumbered. Shared principles unchanged.

The owner explicitly requested separating capture and period summarization from the town process:
background work continues with the town closed; opening the town synchronizes completed summaries.
They also asked to reduce the sense of two disconnected products.

Ship one installer/executable with two process roles. The independent --background-agent role has
no BrowserWindow; it owns the native sampler, report scheduler, local storage and the sole tray.
Normal town windows connect over authenticated per-user local IPC. They do not own the sampler or
model lifetime. Closing a town window quits that UI process, leaving enabled observation running.

Present one Mirrorville identity/icon and one room control: background observation. No separate
collector app, pairing code, login, source checklist or second settings page. Tray actions return
to town, pause/resume or explicitly quit observation. Windows startup remains optional/default off.

The background role receives no human account token and cannot import material into town. It uses
its own persistent anonymous model-service principal and the existing configured model procedure.
Completed narratives stay local. Only an active signed-in town session may submit AI-summary
materials to an owned target, checked by ctx.sender. Reopen batches pending period narratives with
an idempotent source fingerprint, retaining time/provenance and existing card-sharing choices.

The current prototype still uses the chosen local SpacetimeDB model service; that external backend
must be reachable for model work. If unavailable, capture remains local and summarization retries.
This decision separates the game UI from background work; it does not deploy a new cloud model API.
