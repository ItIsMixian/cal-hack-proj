# 0009 Accounts with SpacetimeAuth, explicit guests, and a Figma-designed entry screen

Status: Accepted (agreed verbally on 2026-10-24, recorded afterwards). Implemented on branch `yw/diary`,
not yet merged. Details: `docs/design/login-and-auth.md` and
`docs/validation/login-figma-and-auth.md` on that branch.

## Choice

- **Entry screen first.** Visitors land on a login screen built from the team's Figma file
  ("Cal Hack UI deisign"): pixel-art village, signboard, logo, fields and button exported as image
  layers, with native HTML controls on top and the Pixelify Sans font (OFL) hosted locally.
- **Accounts through SpacetimeAuth.** "Login" / "sign up" go to SpacetimeDB's hosted auth with an
  email magic link (no passwords in our app), using OpenID Connect Authorization Code + PKCE. The
  account's token is what connects to the database, so a person keeps the same identity, mirrors,
  diary and contact across browsers and devices.
- **Guests stay possible, explicitly.** "Explore as a guest" keeps the old anonymous identity per
  browser. Existing guest mirrors are kept; there is no guest-to-account migration.
- **Fail closed.** If account login fails or expires, the app does not silently fall back to an
  anonymous connection.

## Why

Mirrorville keeps personal data for a long time: Mirror Room cards drawn from someone's own messages,
their mirror's diary, who they are interested in, and their contact details. Data that personal and
that durable has to belong to an account, not to a browser token that is lost when storage is cleared
or a device changes. Using the same mirror on a phone at the venue and a laptop later follows from that, and so does the
login page: accounts need an entry point, which is also the first screen judges see.

## Consequences

- Needs `VITE_SPACETIMEAUTH_CLIENT_ID` in `.env.local`; callback URLs must be registered for every
  origin (localhost, 127.0.0.1, and the public domain once 0007 is deployed).
- Pending checks (from the validation record): the same account in two browsers, sign-out, restart
  persistence, token refresh, a real phone, production HTTPS callbacks.
