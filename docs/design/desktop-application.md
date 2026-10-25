Current lifecycle is superseded by [independent background observation](background-observation.md).
Capture/model work no longer belongs to the town window; earlier close-stops-helper notes are historical.

# Windows desktop application

First target: the owner's existing local `mirrorville` database at `ws://127.0.0.1:3000`.
The database service is external and must already be running with its original data directory;
the desktop client does not start a replacement database, publish a module or reset data.
The room/town UI is bundled in the app. No Vite server or Python installation is required to use
the packaged app. The existing local database is still required for town functionality.

## Lifecycle

- Open: one app instance, bundled UI, bundled observer starts paused.
- Desk -> Observe my computer: directly connected. Explicit Start enables sampling; browser page
  topics remain a separate unchecked opt-in. No pairing UI in the desktop app.
- Review/edit/check clues -> hand over: the existing source-letter and facts-import route.
- Leave the desk: chosen observation continues, with status in window title and tray.
- Minimize: window hides to tray. Open/double-click tray restores it. Tray can pause or quit;
  enabling remains inside the source UI so consent remains visible.
- Sign out: pauses. Close window/Quit: stops the helper. If the app process dies, the pipe closes
  and the helper exits on EOF. Renderer crash requests pause. Every app restart is paused.

The helper has the same seven-day/5,000-interval limits as the browser companion. Its derived clue
database is in the app userData `observer/` directory, separately protected by Windows ACLs.
The legacy standalone companion data is neither read nor migrated automatically.

## Files and boundaries

| File | Responsibility |
| --- | --- |
| `desktop/app/main.mjs` | Window, exact loopback UI origin, system-browser auth return, tray, IPC ownership and helper lifecycle |
| `desktop/app/preload.cjs` | Fixed isolated `mirrorvilleDesktop.request` facade; no Node/shell/file API |
| `desktop/app/observer-client.mjs` | Bounded correlated JSON pipe requests and timeouts |
| `desktop/native_host.py` | Private pipe adapter around existing `observer.py`, no HTTP server |
| `src/desktopObserver.ts` | Shared validated response parser; chooses native pipe or existing browser companion |
| `src/DesktopObservationOffering.tsx` | Direct native connection, explicit Start/Pause, same reviewed handoff |
| `scripts/build-desktop.mjs` | Explicit public build config; ignores temporary tunnel/admin settings |
| `scripts/build-desktop-helper.py` | Python runtime bundle, including Conda DLL dependencies where required |
| `desktop/electron-builder.json` | Narrow application file list, bundled helper, Windows installer/portable artifacts |

Renderer has sandbox, context isolation, no Node integration, normal web security and CSP. IPC only
accepts this window's local main frame and the status/observations/pause/clear/capture allowlist.
There is no generic process execution, filesystem read or remote privileged navigation. Loopback
UI server requires the exact Host, serves bundled files only and has no observation HTTP routes.
Only the known OIDC provider with the exact local redirect can initiate external authentication.
Callback state expires in fifteen minutes, is consumed once and is also checked by oidc-client-ts.
Authorization codes/PKCE and account tokens are not logged. Persistent app session storage is separate
from Edge/browser storage; owner data remains accessed through SpacetimeDB identity.

SpacetimeDB SDK 2.13 generates its binary serializers with `Function()`. The script policy therefore
permits `unsafe-eval` for the bundled app; it still rejects inline scripts and remote script sources.
This is required for the existing SDK to enter the town. The isolated preload, main-frame sender
checks, sandbox and disabled Node integration remain independent protections. A first strict-CSP
build reached login but failed at guest entry; the corrected build is tested at town entry too.

## Build

```powershell
npm.cmd run desktop:ui
npm.cmd run desktop:helper
npx.cmd electron-builder --config desktop/electron-builder.json --win --x64
```

Build requirements: Node/npm, Python + PyInstaller. Windows icon is derived from the existing Sage
character art. Installer is per-user and does not require administrator privileges; no startup task
is installed. Artifacts are under `output/desktop-release/`. No signing credential is configured.
Use `npm.cmd run desktop:dev` for a bundled-UI development launch.

`node scripts/build-desktop.mjs --cloud` selects the existing Maincloud town for a future release;
do not distribute that build until the matching server features and real account tests are accepted.
This iteration does not alter the public website, cloud module, cloud data or original browser session.

## Authentication setup

Existing public client: `client_034leYri7AY0CJTanClndG`.
Add exact redirect `http://127.0.0.1:17431/callback` and post-logout redirect
`http://127.0.0.1:17431/`, retaining all existing entries. The code is ready; live provider changes
and real email callback acceptance are recorded separately in validation. UI loopback port is fixed
for stable storage and registration; a port conflict fails visibly rather than choosing an origin
that loses the session or hijacking a running service.


## Contextual activity learning

Native observation now supports the owner-requested full window-title/episode/model chain,
replacing application-use records as the primary desktop source. See [design](activity-understanding.md)
and [validation](../validation/activity-understanding.md). Capture still starts paused; model
understanding is separately manual or explicitly enabled automatic DeepSeek processing.
