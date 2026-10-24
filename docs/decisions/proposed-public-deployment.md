# Proposed: how do people at the venue reach Mirrorville?

Status: Proposed (2026-10-24). Needed before the demo loop works for anyone but us (principles).

## Context

Everything runs on the dev laptop today. The earlier AI Town prototype was shared through Cloudflare
quick tunnels; that worked, but the links died when the session restarted.

## Options

- **A. SpacetimeDB Maincloud + static frontend (proposed).** Publish the module to Maincloud and host
  the built frontend on a static host (GitHub Pages, Vercel or Netlify). Stays up without the laptop,
  stable URL for the QR code and Devpost. Needs: the SpacetimeDB CLI installed outside the agent's
  sandbox, `spacetime login` by one of us, and a static-host account. **Unverified:** whether
  procedures can make outbound HTTP (model calls) on Maincloud, and its limits.
- **B. Tunnels from the laptop.** `cloudflared` quick tunnels for the database (port 3000) and the
  frontend. No accounts, ready in minutes. The laptop must stay awake and online, URLs change on
  every restart, and the QR code has to be regenerated.

## Proposal

A as the real deployment; B as the fallback for judging if A hits a blocker. First step either way: a
10-minute check that a procedure can call DeepSeek from Maincloud.

## If accepted

Record the URLs, who owns the accounts, and how to redeploy in `../HANDOFF.md`; the frontend needs
`VITE_SPACETIMEDB_HOST` / `VITE_SPACETIMEDB_DB_NAME` set at build time.
