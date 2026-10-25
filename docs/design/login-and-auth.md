# Figma login entry and account sessions

The entry screen implements [Cal Hack UI deisign](https://www.figma.com/design/Meypech1vVxgjSMMi8zckU/Cal-Hack-UI-deisign?node-id=0-1). The six original image layers are exported into `public/assets/login/`; their node IDs and render slots are documented alongside them. Pixelify Sans is hosted locally with its OFL license. Inputs, links and buttons are native HTML layered over the exported art, rather than a flattened screenshot.

## Entry flow

- **Login / sign up:** optional email hint, then standard OIDC Authorization Code + PKCE through SpacetimeAuth. The configured email method uses magic links. First-time email verification creates the account; returning users sign into the same account. Passwords are not collected in MirrorVille. The email-link explanation is plain text below the single email field.
- **Explore as a guest:** reuses the existing browser's anonymous SpacetimeDB identity. The guest token stays under its original local-storage key, so existing guest mirrors remain available.
- **Sign out / Leave town:** removes the current in-app session; account sign-out also invokes the provider's end-session flow. A failed account login never silently becomes a guest session.

OIDC tokens are handled by `oidc-client-ts` / `react-oidc-context`, stored in sessionStorage, and passed as the account credential to the SpacetimeDB SDK. The existing anonymous token is never overwritten by an account token. Mode is scoped by database/host and stored per tab. Callback handling also works when a magic link opens a fresh tab; OIDC's state/PKCE store can validate the pending flow across same-origin tabs. Account sessions require an email claim and reject an explicitly unverified email. Refresh uses the provider's silent-renew support and the SDK token provider; connection errors show a retry screen.

## Service configuration

User selected SpacetimeAuth on 2026-10-24. An empty Maincloud database anchors the authentication project; the existing simulation remains on the local `mirrorville` database. This does not complete public deployment decision 0007.

- Maincloud database: `mirrorville-yw9299-hyy77`, owner `yw9299`.
- Auth project: `project_034leYrhEr2N2PvEoNEnHk`.
- Public client: `client_034leYri7AY0CJTanClndG`, name `MirrorVille Web`, public Web application.
- Authority: `https://auth.spacetimedb.com/oidc`.
- Redirects: `http://localhost:5173/callback`, `http://127.0.0.1:5173/callback`.
- Post-logout redirects: `http://localhost:5173`, `http://127.0.0.1:5173`.
- Temporary preview added with owner confirmation on 2026-10-24: redirect
  `https://avenue-beneath-advised-join.trycloudflare.com/callback`, post-logout
  `https://avenue-beneath-advised-join.trycloudflare.com`. These are exact entries, not a wildcard;
  replace/remove them when the temporary tunnel changes or stops.
- Scopes: `openid profile email offline_access`.
- Hosted email login enabled; hosted anonymous login disabled. Guest mode is a separate explicit app action.
- Hosted branding: MirrorVille, cream/sage palette.

Set `VITE_SPACETIMEAUTH_CLIENT_ID` in `.env.local` (already set on this machine), then restart Vite. No client secret belongs in a browser app. Additional origins require exact redirect and logout allowlist entries. Production must use HTTPS. The empty Maincloud anchor is a running cloud resource and can consume account energy; it contains no simulation data or model keys.

## Boundary

This is an entry screen and session integration. It does not migrate existing guest mirrors to account ownership, redesign the town, collect birth dates or implement social imports. Owners of existing guest mirrors can continue in guest mode. Cross-browser account identity and refresh/logout behavior must be validated against real email sign-in, not inferred from the presence of a Login button; see the validation record.
