# Proposed: branded entry screen with SpacetimeAuth and an explicit guest mode

Status: Proposed for teammate review (2026-10-24). Implemented at the user's explicit request on `yw/diary`; runtime acceptance is recorded separately.

## Context

The team supplied a pixel-art Figma entry screen. The app previously connected using a persisted anonymous SpacetimeDB identity and had no account sign-in. The user requested both a guest mode and real accounts, and selected SpacetimeAuth as the provider.

## Choice

Reuse the Figma source images and Pixelify Sans for the entry screen. Use SpacetimeAuth's hosted email-link login through OIDC Authorization Code + PKCE for accounts. Keep browser guests as a separate explicit entry path and preserve their existing token storage. Account tokens must never replace guest tokens or fall back to anonymous identity after authentication failure.

Configure a public Web client with explicit local redirect allowlists; keep secrets out of the frontend. An empty Maincloud database anchors the auth project while the simulation remains local. Authentication setup is separate from publicly deploying the simulation.

## Why

A managed provider supplies real account identity and verification without storing passwords in reducers. Preserving the existing guest token protects access to already-created mirrors. The local form explains the actual hosted email flow rather than pretending to validate a password locally.

## Consequences

The second original input-frame asset displays the secure email-link explanation. Signup and login both continue through the provider; new users complete email verification. Guest-to-account ownership migration is not included. Production URLs need matching callback configuration. The cloud auth anchor uses account resources. Teammate review is still required before assigning a decision number on main.

Details: [design](../design/login-and-auth.md). Checks: [validation](../validation/login-figma-and-auth.md).
