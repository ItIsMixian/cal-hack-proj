# Figma login entry and SpacetimeAuth validation

Date: 2026-10-24, America/Los_Angeles. Branch: `yw/diary`.

Implementation stages: `1b59945` (Figma source layers and entry screen), `8db17fb` (OIDC accounts and isolated guests), followed by the responsive refinement/documentation commit containing this record.

## Results

| Check | Result | Evidence / limits |
| --- | --- | --- |
| Reuse the team's Figma artwork | **Pass** | Six original PNG source layers exported through high-fidelity design context, downloaded locally and verified with Pillow. File/slot provenance is in `public/assets/login/README.md`. The combined reference screenshot is not an implementation asset. |
| Desktop composition and assets | **Pass** | Desktop screenshot captured at 1280 × 720, plus live Edge preview at approximately 1384 pixels wide. A later 705-pixel DOM audit confirmed all six images loaded, Pixelify Sans loaded, and frame/logo/two field slots/button geometry within 0.011 CSS pixels of their scaled Figma coordinates. Source transparent margins and field-crop geometry are preserved. |
| Phone composition | **Pass** | Actual browser iframe with a 390 × 844 document, measured document/scroll widths both 390. Checked the mobile media query, title/frame alignment, input readability, native controls, registration link, feedback placement and guest footer. A first inspection found feedback crossing the decorative frame; the final CSS moves it to a readable cream surface below the frame. See final screenshot. This is iframe-based responsive QA, not a physical-device test. |
| Email input and keyboard navigation | **Pass** | Native `type=email` input rejects an invalid address before submission. Tab from the email input focuses Login. The original second frame explains email-link sign-in, with no fake password field. |
| Registration entry | **Pass (UI)** | “sign up” changes the form label, action and explanation; “back to login” restores login. Both actions lead to the same hosted email verification flow. |
| Actual SpacetimeAuth service setup | **Pass** | Created auth project and public Web client under user account `yw9299`; saved exact localhost/127.0.0.1 callbacks and logout callbacks. Hosted email login enabled, hosted anonymous login disabled, cream/sage branding saved. Client ID is configured in ignored `.env.local`. The local database was not republished or cleared. |
| Real account sign-in redirect | **Pass** | Clicking Login opened the actual `auth.spacetimedb.com` interaction page with an email field and Send magic link. No password grant is advertised by the live OIDC discovery document; the app uses Authorization Code + PKCE. |
| Real email verification and return to town | **Pass (user-assisted)** | User completed the email magic-link step and explicitly confirmed entering the town. Subsequent Edge inspection was blocked by the browser extension reporting that its debugger was detached, so no independent account-mode screenshot or owner query is claimed. |
| Guest enter / leave | **Pass** | In a live browser, Explore as a guest opened the connected town with Guest and Leave town; Leave town returned to the entry screen. |
| Preserve existing guest ownership | **Pass** | The existing in-app browser guest still opened Diary Alice's Mirror Room with its saved `diary-alice@example.test` contact after account integration. No anonymous-token migration or data reset was performed. |
| Session routing and fail-closed behavior | **Pass (automated)** | `npm.cmd run test:auth`: 8/8. Runs the actual SessionRoot with React server rendering and mocked OIDC/SDK boundaries. Covers account token selection, guest token preservation even when an account exists, failed/expired account login refusing an anonymous connection, provider-anonymous/unverified account rejection, a fresh-tab callback after verification, forged callback refusal, missing client configuration, and explicit guest operation without client configuration. It does not validate provider cryptography or real token refresh. |
| Backend regression | **Pass** | `npm.cmd run test:diary`: 10/10. Backend typecheck passed. No backend source or generated bindings changed for this feature. |
| Production build and frontend typecheck | **Pass** | `npm.cmd run build`, `npx.cmd tsc --noEmit -p .`. |
| Account ownership consistent in two browsers | **Pending** | Needs the same verified account to create a mirror in one origin and see it in the other; not inferred from the user-confirmed first login. |
| Account sign-out, restart persistence, expired-token refresh/reconnect | **Pending (live)** | Routing cases are automated; actual provider/server expiration and sign-out need a live browser check. The user account was left signed in instead of being signed out for a test after browser control detached. |
| Physical phone / soft keyboard, production HTTPS callbacks, screen-reader QA | **Pending** | No claim based solely on CSS or the iframe capture. |

## Visual evidence

- [Desktop entry](login-assets/desktop.png)
- [390px phone layout](login-assets/mobile-390.png)

The browser viewport-override control did not reliably apply the requested size and caused a control timeout. Temporary overrides were reset where the tool allowed it; the detached Edge target rejected its reset request. For the narrow test a temporary local HTML wrapper embedded the actual app at 390 × 844 instead. That wrapper was removed after validation and is not part of the delivered app.

Visual checks included original image identity and loading, exact proportional placement, native input and button geometry, local pixel font, readable palette, framing/spacing, feedback contrast, keyboard focus and horizontal overflow. No new image was generated or substituted.

The final entry-page console error query returned no errors. `git diff --check` passed; the protected principles and 0004 decision have no branch diff. No temporary Figma asset URL is referenced by runtime code.

## Boundaries and reproducibility

`docs/design/login-and-auth.md` records the auth project, public client ID, exact callback URLs and deployment boundary. The empty Maincloud database anchors authentication only; the simulation still runs on local `mirrorville`. No model keys or client secrets are committed. Existing guest mirrors stay with their browser; guest-to-account migration is not included.

On a fresh checkout, copy the public client ID into `.env.local` as `VITE_SPACETIMEAUTH_CLIENT_ID`, start the existing local backend, then run `npm.cmd run dev`. Login sends the optional email as a login hint; verification occurs only on the provider page. Guest mode remains explicit. For the cross-browser check, use localhost and 127.0.0.1 with the same verified email account.

References: [SpacetimeDB authentication](https://spacetimedb.com/docs/core-concepts/authentication/), [official React integration](https://spacetimedb.com/docs/core-concepts/authentication/spacetimeauth/react-integration/). The live discovery document and actual hosted form were also inspected; current email authentication is magic-link based.
