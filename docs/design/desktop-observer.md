# Mirrorville desktop observation

The primary desktop source is now a small Mirrorville-native Windows observer in
`desktop/observer.py`. It is inspired by the useful sensing idea in Marglo, but does not import or
run Marglo, read its database, or copy its agent/personality implementation. Package-file exchange
remains a secondary compatibility path, not the primary acquisition mechanism.

## Run and pair

Python 3.10+ on Windows is sufficient; no third-party packages or model keys are required.
Double-click `desktop/start-observer.cmd`, or run:

```powershell
python desktop/observer.py --origin http://localhost:5173 --origin http://127.0.0.1:5173 --origin https://itismixian.github.io
```

Origins are exact scheme/host/port, without URL paths or trailing slash. Additional preview origins
must be supplied explicitly. The default bridge address is `http://127.0.0.1:17358`. The default
private directory is `%LOCALAPPDATA%/Mirrorville/observer`; `--data-dir` can choose a dedicated new
folder. Existing mixed folders, drive roots, home/AppData roots and symlink/junction targets are
rejected before any ACL change. Windows permissions are restricted to the current account, SYSTEM
and administrators. Only the helper's marked own directory may be reused.

The helper starts **paused**. It shows a local eight-character pairing code and also writes it to
`pairing-code.txt` inside its private directory. Optional `--pairing-file` must name that same file
inside `--data-dir`. Open the room's desktop source, find the helper, enter the code, and explicitly
enable observation. Browser reading-topic observation is a separate opt-in, off by default.
Successful pairing consumes/rotates the code and pauses capture. Tokens are never written to disk.

Pause stops observation. Clear pauses and deletes recorded clue rows. Disconnect pauses, revokes the
session token and rotates the pairing code. Closing the browser panel does not stop the separately
running helper; its visible status explains this. Stop the helper terminal with Ctrl+C to stop the
process. A session expires after twelve hours and capture then stops. The pairing code expires after
fifteen minutes; restarting the helper provides a fresh code.

## What is actually observed

Only the foreground application's process name, window title and session idle time are inspected.
The Win32 sampler uses `GetForegroundWindow`, `GetWindowTextW`, `GetWindowThreadProcessId`,
`QueryFullProcessImageNameW` and `GetLastInputInfo`. It checks the active input desktop is the normal
`Default` desktop; inaccessible/locked desktops fail closed. There are no screenshots, keyboard
contents, clipboard reads, microphone recording, cookie reads or file/content scanning.

Raw foreground titles and executable paths exist transiently in memory. Known shapes are reduced
to meaningful, concise labels: a VS Code/Cursor workspace, a Unity project/scene, or a Blender
document basename. Optional browser reading-topic extraction is restricted to research/documentation/
project-shaped page titles and rejects common sensitive app/site/title markers, contact details,
URLs and paths. A GitHub title produces only the repository-name clue, not another author's text.
Unsupported applications and unrecognized title shapes are ignored.

Title-derived labels still contain selected words from titles. The filters are deliberately
conservative, but cannot guarantee semantic anonymization or identify every private project name.
Owners can inspect and clear local clues, and must review/edit each clue before cloud handoff.
Browser topics can be disabled independently. An observed page/topic is not proof of endorsement,
an observed workspace is not proof of completed work, and foreground duration is not a preference.

Derived labels, app categories, UTC dates and elapsed durations are stored locally in SQLite.
Uninterrupted equal contexts aggregate on export; stable hashed context IDs survive ordering changes.
Idle intervals, locked desktop, unsupported windows, pauses and elapsed gaps reset continuity.
Both monotonic and wall-clock gaps must be positive and within twice the poll interval (maximum
fifteen seconds), so sleep or suspend time is not counted. Sampling defaults to two seconds;
`--poll-seconds` accepts 0.5–10. At most 5,000 recent intervals are retained; exported candidates
cover seven days and at most sixty distinct contexts. Durations are stated in seconds rather than
rounding a two-second observation up to a minute.

## Loopback protocol

Every endpoint requires exact allowed Origin and exact `Host: 127.0.0.1:PORT`, including preflight.
No wildcard CORS or DNS-rebinding host is accepted. Only `/health` has an unauthenticated response,
and it contains service name/version only. Every personal-data or control endpoint requires a
constant-time checked bearer token, except `/pair`, which requires the locally shown one-time code.
Five failed code attempts produce a sixty-second lockout. Ambiguous Authorization, Content-Type and
Content-Length headers, transfer encodings, non-JSON writes, bodies over 4 KB and query-string
routes are rejected. Socket reads time out. Request paths, titles, tokens and exception details are
not logged. CORS preflights permit only GET/POST and Authorization/Content-Type, and include the
private-network opt-in response for supported browsers. Browser mixed-content/local-network policy
can still require browser permission or prevent a public HTTPS page reaching local HTTP.

| Request | Result |
| --- | --- |
| `GET /health` | `{service:"mirrorville-desktop",version:1}` only |
| `POST /pair {code}` | `{token}`; rotates code and pauses |
| `GET /status` | `{enabled,browserTopics,observations}`; count is distinct exported contexts, capped sixty |
| `POST /capture {enabled,browserTopics?}` | Explicit on/off; optional separate reading-topic consent |
| `GET /observations` | Versioned candidate JSON, all observations tentative |
| `POST /clear {}` | Pauses and clears local clue rows |
| `POST /disconnect {}` | Pauses, revokes token and rotates code |

The candidate encoding reuses the versioned compatibility structure from
[marglo-package-format.md](marglo-package-format.md). Frontend labels present the producer as
**Mirrorville desktop**. The browser holds the token only in memory, and locally previews/edits
candidates. Explicit owner-reviewed handoff enters the existing redacted facts-import pipeline;
the desktop helper itself never uploads to SpacetimeDB or a model and does not infer speaking style.

This implementation covers Windows desktop activity. Phone sensing, a macOS collector, automatic
background cloud sync and observation of arbitrary app content are not implemented. Verification
commands: `python desktop/test_observer.py`; integration evidence belongs in `docs/validation/`.
