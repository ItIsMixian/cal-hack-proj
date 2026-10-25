# Local frontend runtime check

Date: 2026-10-24 (America/Los_Angeles). Code baseline: local yq `a416066`. This is an actual browser/runtime check, separate from the previous merge's build and automated tests.

## Checked

- PASS: the existing frontend at http://127.0.0.1:5173/ returns HTTP 200 and renders the MirrorVille login screen. No replacement server was started.
- PASS: all five DOM image elements report complete with nonzero natural width. At the observed 564px viewport, document content width is also 564px (no horizontal overflow).
- FAIL: guest entry reaches "We couldn't reach the town" instead of the map. The configured VITE_SPACETIMEDB_HOST uses concord-mounts-grateful-handy.trycloudflare.com; an independent read-only request fails DNS resolution (getaddrinfo failed). The local frontend is serving pages, but its configured backend is unavailable.
- FAIL / NOT CONFIGURED: VITE_SPACETIMEAUTH_CLIENT_ID is absent in the local configuration. Clicking Login without entering an email produces "Account sign-in is not ready yet. You can explore as a guest for now." No email was sent and no account authentication was attempted.
- WARN: the browser reports React's fetchPriority DOM-prop warning from LoginArt. Images still load; this warning does not explain the backend connection failure. No application fix was made during this check.
- The temporary preview origin documented by the teammate, frequent-converter-stockings-place.trycloudflare.com, returns HTTP 200. This only verifies its web entry, not that it is the correct replacement database endpoint or that its town connection works.

## Evidence

- [Guest connection failure](frontend-runtime-assets/town-connection-error.png).
- [Login configuration alert](frontend-runtime-assets/login-not-configured.png).

## Initial result and boundaries

The local frontend can display its login screen, but the full town experience currently cannot be verified or used through the configured backend. A current reachable shared database address is needed; real account login also requires the correct public SpacetimeAuth client configuration.

No application code, backend address, auth configuration, database state, residents, account permissions or deployment settings were changed. The check used guest entry and local navigation only; no mirrors or messages were created. Map rendering, live movement, Home and diary interactions could not be exercised past the failed connection. No new build/test pass is claimed here; the previous merge's checks remain in their own validation record.

## Recovery after the user provided the current shared address

The user subsequently supplied https://frequent-converter-stockings-place.trycloudflare.com/. The following recovery supersedes the initial connectivity result above, while preserving its evidence.

- PASS: the supplied preview supports guest entry, loads its authored map and reports 7 mirrors.
- Updated only the ignored local environment file: VITE_SPACETIMEDB_HOST now points to the supplied origin using wss, the database remains mirrorville, and VITE_SPACETIMEAUTH_CLIENT_ID uses the existing public client documented in design/login-and-auth.md. Other environment settings were preserved. No secret was added or copied.
- PASS: after local reload, http://127.0.0.1:5173/ enters the town, reports 7 mirrors, enables Make your mirror, and the canvas reports data-town-renderer=authored. The map loading/retry panel clears.
- PASS: Residents opens a populated list and closes normally. No mirror was created, changed or selected for a state-changing action.
- PASS: a separate local tab's Login button reaches the official hosted Login screen with an Email address field and Send magic link button. No email was entered or sent, and real account authentication was not completed.
- PASS: npm.cmd run build succeeds with the recovered local environment, producing the frontend production bundle.
- The existing React fetchPriority warning remains; it does not block the observed map or navigation.
- Evidence: [restored local town](frontend-runtime-assets/town-restored.png), [hosted login entry](frontend-runtime-assets/account-login-ready.png).

No application source, backend database, residents, OAuth allowlists or remote branch was changed. Original browser guest-token keys were not deleted; the application scopes guest identity by backend hostname, so a new tunnel origin can select a different saved guest identity. Existing identity ownership and full account completion were not validated in this check.
