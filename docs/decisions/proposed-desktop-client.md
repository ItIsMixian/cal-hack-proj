# Integrated Windows desktop client

Status: owner-authorized implementation, 2026-10-25. Unnumbered; no change to shared principles.

The owner asked this chat to take over desktop migration after reading “整合 Marglo 核心到
Mirrorville”. That discussion asks for the existing town and a Marglo-like observation capability
in one app: no separate terminal, manual helper startup or pairing code. The owner explicitly
selected the existing local database for the first acceptance build. Shared cloud deployment and
database migration are outside this iteration. The weekend-only native-app exclusion in principles
is retained as historical scope; this extension does not rewrite team agreements.

Reuse React/Vite and SpacetimeDB. Electron owns the window, tray and a bundled Windows observer;
the Python implementation is packaged with its runtime, so users do not install Python. Local
observation remains paused at startup. Explicit Start enables the existing conservative Win32
sampling. Minimize keeps the app in the tray; close/Quit stops it; sign-out pauses it. Raw titles
remain transient, derived clues remain local and reviewed handoff uses the existing redacted
facts import. Observation never learns voice or silently uploads a clue.

The desktop observer uses private stdin/stdout, with a small command allowlist through an isolated
preload. No loopback observation listener, bearer token or pairing code is exposed to the renderer.
Web users retain the existing companion protocol. This is a transport/lifecycle integration, not a
replacement of the reviewed-clue pipeline or a new interpretation of Marglo data.

Bundled UI uses a stable `http://127.0.0.1:17431` origin. OIDC runs in the system browser with PKCE;
the app accepts a matching, unexpired state at the exact callback, then returns it to its own
renderer/storage. Adding that redirect/logout origin to the existing public auth client is a
separate access configuration step requiring confirmation. No client secret is used or bundled.
Browser guest credentials are not automatically copied. Same-email account identity is reused.

The shell follows Electron's [isolation and IPC sender guidance](https://www.electronjs.org/docs/latest/tutorial/security).
Current architecture and remaining acceptance are in [desktop application](../design/desktop-application.md).
