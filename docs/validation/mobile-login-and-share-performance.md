# Mobile login, sharing speed and callback repair

2026-10-24 · `yw/map-assets`.

## Report and fixes

Owner reported roughly 20 seconds to load login on a phone, clipped art strips, and an
`invalid_redirect_uri` error after choosing account login. The temporary share origin was
missing from the SpacetimeAuth client's allowlist.

- Kept original Figma PNGs; generated WebP copies and responsive phone variants.
  Original six PNGs: 8,594,467 bytes. Desktop derivatives: 597,622 bytes. Phone requests only
  two artwork files totaling 120,800 bytes; hidden desktop decorative frames are not fetched.
- Embedded the 23,048-byte WOFF2 font into CSS to avoid an extra font request. The production
  JS and CSS are gzip delivered (approximately 124.5KB and 32.1KB). Initial phone page assets
  therefore total approximately 0.28MB, excluding OIDC discovery/network overhead.
- Temporary share domains receive production HTML/assets instead of Vite's development module
  graph. Local development keeps HMR. Share output updates after `npm.cmd run build`.
- Phone controls now use normal layout flow. Removed the second input-frame appearance on all
  screen sizes; only the email input remains, followed by plain email-link guidance.
- After explicit owner confirmation, saved the current share origin's exact login and logout
  callbacks in `MirrorVille Web`, retaining both localhost entries. No wildcard added.

## Validation

| Check | Result |
| --- | --- |
| `npm.cmd run build` | Pass |
| Full existing suite plus production-preview boundary/compression/cache tests | Pass (59 tests) |
| Production share HTML references hashed JS/CSS; no dev source modules | Pass |
| Gzip delivery, local HMR passthrough, callback route and cache invalidation | Pass (automated) |
| Public source/.env/traversal paths do not fall through to Vite | Pass (automated) |
| Phone artwork requested is 120,800 bytes rather than multi-MB PNGs | Pass (source selection / generated sizes) |
| 390×844 phone layout: one email field, plain explanation, Login/signup/guest controls | Pass (final responsive art/font screenshot checked) |
| Callback save persisted in dashboard | Pass (Last Updated changed to 16:56:48 PT) |
| Real share Login → hosted email field and Send magic link | Pass; no redirect error |
| Full email magic-link completion on owner's phone | Pending (owner-operated) |
| Actual phone first-load time on venue Wi-Fi | Pending; do not infer seconds from byte reduction |
| Desktop layout after final delivery update | Pass (1280×720 browser screenshot) |
| Production share guest entry after final delivery update | Pending (connection check in progress) |

One external HTML request took approximately 1.77 seconds. An earlier 307KB background request
still took about 12.1 seconds over the temporary tunnel; byte reduction does not remove network
variability. No database publication/reset, private import payloads or account credentials were
part of these changes. Screenshots are outside the repository.

## Map loading follow-up

The reported old-map appearance matches the previous silent fallback renderer. Removed that
fallback from the live canvas: loading/error status and a retry control now remain explicit.
Artwork requests time out after 20 seconds. Town delivery copies total 1,365,282 bytes instead
of 11,255,664 bytes, retaining dimensions/alpha and original PNG hashes. Tile atlases are lossless.
A loader regression checks every shipped WebP, all 231 draws, and no partial painting on failure.
Build and 60 tests: Pass. Phone retry/appearance and production guest connection: Pending.
At the first GitHub checkpoint, ports 5173/3000 were not listening after restart. A replacement
tunnel was subsequently started; the previous temporary URL is obsolete.

Owner requested removal of the legacy map source: deleted `src/TownArt.ts` and made the
artwork-loading status a full-screen page with retry. Production build: Pass. Per owner request,
phone/teammate runtime checks are delegated to them (Pending). Restarted the existing local
database data directory and Vite, and started a replacement temporary tunnel. No DB publish/reset.

## Restart correction

Phone entry reported connection failure. Initial restart had opened a new empty default data
directory rather than the original packaged Claude application directory. Restored the original
data directory and original JWT key paths explicitly; local database identity endpoint returned
200 (previously 404). No publish/reset or data replacement. Updated exact replacement-domain
login/logout callbacks after owner confirmation (dashboard Last Updated 17:28:42 PT).
External guest/account and phone map checks remain Pending, delegated to owner as requested.

## Single email-entry flow and consolidated panel

Owner reported duplicate email entry on app and hosted provider. Supersedes earlier local
email-field layout: the entry panel now offers Continue with email and Explore as a guest
together, with a short premise introduction and browser-only guest note. Removed separate
sign-up mode and local email collection/login_hint. The email is entered only on the hosted
SpacetimeAuth page; this does not implement direct magic-link sending from the app.
Build/typecheck: Pass. Existing auth session regression: Pass (10 tests). Desktop/phone
composition and complete owner-operated email login: Pending. Database unchanged.
