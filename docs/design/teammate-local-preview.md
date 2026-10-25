# Local frontend against the shared town

Current temporary endpoint as of 2026-10-24. Replace this hostname after tunnel restarts.
Only public client configuration is needed; never copy publisher/model keys.

Create .env.local (gitignored):

```dotenv
VITE_SPACETIMEDB_HOST=wss://frequent-converter-stockings-place.trycloudflare.com
VITE_SPACETIMEDB_DB_NAME=mirrorville
VITE_SPACETIMEAUTH_CLIENT_ID=client_034leYri7AY0CJTanClndG
VITE_SPACETIMEAUTH_AUTHORITY=https://auth.spacetimedb.com/oidc
```

Run npm.cmd install, then npm.cmd run dev. After changing environment settings, stop and
restart Vite. Use http://localhost:5173 or http://127.0.0.1:5173; both login callbacks are
registered. Do not silently accept a different port for real login without registering it.
Guest mode does not require the auth client ID. Writes from this preview affect the shared
town. Keep client bindings compatible with the current published module.

The previous concord-mounts-grateful-handy hostname is obsolete. The dev laptop, local
SpacetimeDB and cloudflared must stay running. Maincloud simulation deployment remains separate.
The current public frontend returned HTTP 200 during troubleshooting; teammate runtime
connection/account validation remains Pending.
