# Guest account transfer and duplicate resident management

2026-10-24, working tree on `yw/map-assets` (includes pre-existing onboarding work).

## Verified

- Live local SQL confirmed `Yiqiao Liu` IDs 12 and 13 have distinct owner identities. Their rows
  were preserved; matching names do not prove a common owner.
- 49 tests passed: `node --test scripts/test-diary.mjs scripts/test-auth-session.mjs
  scripts/test-guest-transfer.mjs scripts/test-fidelity.mjs scripts/test-share-preview.mjs`.
  Added cases cover private guest proof, expiry/revocation/issuer/email checks, same-account retry,
  denial of a different account, all current ownership-bearing data, retained IDs/contacts/cards,
  guest access revocation, pending-transfer UI gate, and diary completion during a transfer.
  Client tests cover HTTPS guest authorization, capability persistence, missing credentials,
  storage failure, server failure and network failure. Owner-only archival/restoration and both
  duplicate-name creation paths are covered.
- `npx.cmd tsc -p spacetimedb/tsconfig.json`, `npm.cmd run build` and SpacetimeDB module build passed.
- Regenerated bindings using the installed 2.13 CLI. Local migration preflight reported only new
  private `guest_transfer` and per-owner `my_archived_mirrors`, with no client-breaking changes or
  destructive migration. Published with the existing publisher token through the local HTTP API;
  CLI default identity was a different identity and received 403. No CLI login was changed.
- Live shared-page Residents displayed separate `#12` and `#13` labels after refresh.
- Following the user's instruction to retain account-maintained residents, audited the auth
  project's two user IDs in the provider's Users page. Derived their database identities using
  the installed version's [official `Identity::from_claims` algorithm](https://github.com/clockworklabs/SpacetimeDB/blob/v2.13.0/crates/lib/src/identity.rs):
  SpacetimeAuth issuer + subject, BLAKE3 with the identity prefix/checksum. These exactly matched
  the private owners of `Yiqiao Liu #12` and `mixian #9`. Connected credentials independently
  identified `Yiqiao Liu #13` as a localhost guest. No email addresses or credentials were written
  into this record.
- Reversibly moved out non-account residents #6, #7, #8, #10, #11, #13, #14 and #15 using the
  existing admin reducer. All 15 mirror rows remain, including the previously inactive demos.
  Final SQL and the live shared-page Residents panel both showed only #12 and #9 active.
  Screenshot: `output/account-residents.jpg`.

## Remaining acceptance / limits

- Complete a real guest -> hosted email sign-in -> callback -> account flow in the same browser
  origin, including a magic link opening another tab. Verify the same mirror ID and private cards
  and diary in the account. Automated checks use mocked authenticated contexts, not a live email
  account claim.
- A lost guest token or changed browser origin cannot be recovered by name. Guest mirrors still
  stay in town on exit; transfer supplies account ownership rather than an expiry policy.
- Existing same-name mirrors are not automatically merged. The user's requested account-based
  cleanup has been applied to the current database; future owners can use Move out / Bring back.
- Pending import completion now uses the current profile/status owner and ignores owner-only
  changes in its stale-card signature. Compilation passed; the network-in-flight import race has
  not been exercised with a real model call.
