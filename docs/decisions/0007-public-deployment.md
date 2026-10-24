# 0007 Public deployment: SpacetimeDB Maincloud + static frontend, tunnels as fallback

Status: Accepted (2026-10-24). Not implemented.

## Context

Everything runs on the dev laptop today. The earlier AI Town prototype was shared through Cloudflare
quick tunnels; that worked, but the links died when the session restarted.

## Choice

- **Main path: SpacetimeDB Maincloud + a static frontend.** Publish the module to Maincloud and host the
  built frontend on a static host (GitHub Pages, Vercel or Netlify). Stays up without the laptop and
  gives a stable URL for the QR code and Devpost.
- **Fallback for judging: tunnels from the laptop.** `cloudflared` quick tunnels for the database
  (port 3000) and the frontend, if the main path hits a blocker.
- First step: a 10-minute check that a procedure can call DeepSeek from Maincloud.

## Alternatives

Tunnels only: no accounts and ready in minutes, but the laptop must stay awake and online, URLs change
on every restart, and the QR code has to be regenerated each time.

## Consequences

- Needs the SpacetimeDB CLI installed outside the agent's sandbox, `spacetime login` by one of us, and a
  static-host account.
- **Unverified:** whether procedures can make outbound HTTP (model calls) on Maincloud, and its limits.
- Once deployed, record URLs, account owners and how to redeploy in `../HANDOFF.md`. The frontend needs
  `VITE_SPACETIMEDB_HOST` / `VITE_SPACETIMEDB_DB_NAME` at build time.
