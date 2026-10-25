# iPhone shared-item receiver validation

Scope: source/fragment protocol, local review, owner selection and existing import handoff.

The final combined check passed **82/82 Node tests**:

```powershell
node --test scripts/test-source-offering.mjs scripts/test-github.mjs scripts/test-marglo-package.mjs scripts/test-desktop-observer.mjs scripts/test-first-meeting.mjs scripts/test-importers.mjs scripts/test-learning.mjs scripts/test-facebook.mjs scripts/test-auth-session.mjs scripts/test-mobile-share.mjs scripts/test-iphone-share.mjs
```

Eight receiver tests exercise rich native JSON/Shortcuts UTF-8 input, literal plus handling,
identifier redaction, malformed and oversized data, future/invalid dates, credential/unsafe links,
OIDC hash/query isolation, own-fragment clearing, redacted fifteen-minute cache/expiry/discard,
explicit authorship/reference gating, reference quotes excluded from model handoff, correct facts
mode and empty event date, approval reset on a new item, owner-view selection, and React StrictMode
double initialization/effect execution without render-time history mutation.

The iOS worker's five checks cover manifests/privacy/static source plus actual TypeScript parser
compatibility for the native UTF-8/base64url fixture and the simple URI-encoded Shortcuts route.
These are not Swift runtime/device tests. Existing authentication, source flow, desktop, import and
learning checks are included in the combined 82 tests.

`npm.cmd run build` passed TypeScript and Vite production bundling. The JS bundle emits the existing
greater-than-500-KB advisory, not a build error. No backend/schema/bindings changes or publication.

## Browser checks reported by parent

- Actual localhost synthetic `#mirrorville-text=` input produced a pending-item banner and removed
  its own URL fragment. The draft survived guest entry. No automatic import occurred.
- **Review shared item** displayed explicit owned-mirror selection and unchecked own/reference
  choices. Choosing reference exposed the separate meaning field and kept handoff disabled.
  No reducer handoff was clicked and no real user's private shared content was used.
- Parent opened a synthetic `#mirrorville-text=` URL on the actual HTTPS production-preview tunnel
  after the final build: the own fragment was cleaned, the pending-item banner appeared, and no
  automatic import occurred. The realtime town connected successfully with four active residents.
  The new guest had no owned mirror; review correctly offered creation rather than another user's
  mirror. An unsaved synthetic name reached the desk and its **Shared from my iPhone** source;
  the original draft, unchecked authorship choices and disabled handoff were visible. The tab was
  closed without clicking handoff/door/room-close, so no test mirror or import was committed.
  Screenshot: [HTTPS shared-item review](iphone-share/https-shared-review.png). This is a desktop
  browser HTTPS check at its default viewport, not actual iPhone acceptance.

## Pending and limits

- Real iPhone Shortcut setup, native compilation/signing/install, Share Sheet invocation and
  same-tab/fresh-tab email flow on the actual device remain human/device acceptance.
- There is no automatic native inbox-deletion handshake; native saved drafts remain until the
  owner deletes them. Website success does not prove native cleanup.
- Selected shared links are not fetched, and referenced third-party prose is not sent as biography.
  Owner declarations and generated factual interpretation still need human acceptance.
- The normal memory draft disappears on refresh/close unless its redacted same-tab sign-in cache
  was deliberately prepared; that cache expires after fifteen minutes and does not cross all tabs.
- This is explicit text/link sharing, not background iPhone app observation; photos/audio unsupported.

Design: [iPhone receiver](../design/iphone-web-receiver.md).
