# Facebook own-post import validation

Date: 2026-10-24. Scope: browser source adapter, local preview and existing import handoff.

## Checked

- `node --test scripts/test-facebook.mjs`: **7/7 passed**. Actual adapter functions and component
  callbacks exercise owner/date filtering, exclusion of tags/attachments/stories, contact redaction,
  edited-text re-redaction, whole-post letter limits, retained dates, minimum body length, synchronous
  popup initiation, permissions/account checks, five-page bounds, untrusted pagination URLs,
  cancelled/expired/denied/malformed responses, empty results, abort, SDK lazy single-flight loading,
  loader retry/timeout, missing configuration and stale-draft removal on failed reconnection.
- `node --test scripts/test-first-meeting.mjs scripts/test-importers.mjs`: **14/14 passed** after
  integration. Existing letter/file filtering and first-meeting flows remain covered.
- Final combined run of Facebook, first-meeting, importers and learning suites: **35/35 passed**.
- `npm.cmd run build`: **Pass**, including TypeScript and production bundle. Vite reports the existing
  large-chunk advisory. No database table, reducer, generated binding or publication is part of this source.
- Parent verified actual browser navigation on `http://localhost:5173`: Mirror Room -> Open Writing
  desk -> room journey -> own messages -> Bring Facebook posts. The honest unconfigured notice and
  return action fit the desk paper. No import was submitted and the Facebook SDK was not loaded.
  Screenshot: [unconfigured source](facebook-import/unconfigured.png).
- An unscoped `git diff --check` reports existing CRLF-as-trailing-whitespace across unrelated dirty
  files (including the untouched server module). These were not normalized or rewritten.
  Scoped changed tracked files pass with `git -c core.whitespace=cr-at-eol diff --check`.

## Pending external acceptance

No `VITE_FACEBOOK_APP_ID` exists in the local configuration; no Meta app was created/configured and no
real account was connected. Thus these checks do **not** prove OAuth success, permission approval,
current Graph field availability or real-post import on Facebook. Official developer pages returned
HTTP 429/inaccessible during verification. App ID, dashboard setup, role-user testing and public
permission approval remain required; see [setup](../design/facebook-import.md).

No remote deploy or real-profile mutation occurred. This is manual one-time import, not sustained
near-real-time data synchronization. Untagged third-party prose needs owner removal; automated
identifier redaction is not semantic anonymization. API origin/authorization is checked only in the
browser; as with pasted writing, the backend does not attest Facebook provenance cryptographically.
