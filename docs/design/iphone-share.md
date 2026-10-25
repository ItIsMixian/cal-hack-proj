# iPhone selected-text and link intake

Status: native source/configuration and manual Shortcuts recipe. Native compilation, signing,
installation and device acceptance are **Pending** on the Windows development host. Web receiver
implementation lives in `src/mobileShare.ts` and `src/MobileShareReview.tsx`; browser evidence is
recorded in the mobile-share validation.

The first phone path is deliberate sharing from the system share sheet. It does not observe other
apps, read private chats, fetch the shared page, or interpret photos/audio. Text from another app is
unclassified material, not automatically the owner's wording or biography. A URL is a shared
reference, never evidence that its content was read, endorsed or experienced.

## Try on an iPhone without a Mac

This uses Apple's **Shortcuts** app, not the unbuilt native project. The destination must already
serve the new receiver. The current Pages deployment may not contain this change until deployed.
For a development test, the owner can use the running production preview tunnel after a successful
local build; tunnel availability and the actual address must be verified at test time.

1. In Shortcuts create **Bring to Mirrorville**. In its details enable **Show in Share Sheet**
   (`在共享表单中显示`). Limit accepted input to **Text** and **URLs**; use **Stop** when no input is
   provided. Do not enable Photos, Files or Safari webpage extraction.
2. Add **Get Text from Input** (`从输入中获取文本`), using **Shortcut Input**. If multiple items are
   supplied, use **Get Item from List → First Item** so one intentional piece is delivered.
3. Add **Ask for Input**, input type Text, prompt **Review what to bring to Mirrorville**, with the
   received text as the default. Edit out private details and anything about other people. This
   keeps the human preview before constructing the URL. Keep the excerpt short for the first test.
4. Add **URL Encode** (`URL 编码`), action **Encode**, applied to the reviewed text only. Do not encode
   the entire destination URL and do not add **Get Contents of URL**.
5. Add **Text**, containing the approved website base followed by `#mirrorville-text=` and the
   encoded-text magic variable. Example destination after deployment:

   ```text
   https://itismixian.github.io/cal-hack-proj/#mirrorville-text=[URL Encoded Text]
   ```

   `[URL Encoded Text]` means insert the actual Shortcuts magic variable, not those literal brackets.
   For the current temporary preview replace only the base with the verified HTTPS preview origin.
6. Add **Open URLs** with the constructed text. Finish and pin the shortcut in the share sheet.
7. In Notes select a harmless test sentence, tap Share → Bring to Mirrorville, review it, and
   continue. The website should open with **Review shared item**, then clear the fragment.
   Sign in if needed, choose an owned mirror, review the redacted text, and explicitly hand it over.
   If the normal homepage appears without a shared-material review, the deployed site is stale,
   the input was empty/unsupported, or the shortcut built the URL incorrectly. Do not assume import.

The shortcut's exact actions/UI names vary by iOS language/version; the recipe must be exercised on
the target phone. No signed `.shortcut` artifact or one-tap installation is claimed. Until device
acceptance, copy/paste into Mirrorville remains the fallback. The URL fragment is not an HTTP query;
it can still be visible transiently to the OS, browser UI and the destination page. Do not use real
sensitive material for setup tests. There is no remote article-fetch action in this recipe.

The currently verified temporary preview base is
`https://frequent-converter-stockings-place.trycloudflare.com/`. It is temporary and depends on the
owner's local preview/tunnel remaining running. A fresh `npm.cmd run build` updates its production
bundle. Use it only after receiver browser validation; the permanent Pages site needs a deployment.

Apple documents [launching a shortcut from another app](https://support.apple.com/guide/shortcuts/apd163eb9f95/ios),
[input types](https://support.apple.com/guide/shortcuts/apd7644168e1/ios) and
[opening constructed URLs](https://support.apple.com/guide/shortcuts/apd68802640c/ios).

## Native source architecture

`ios/project.yml` defines an iOS 16+ SwiftUI containing app and a `com.apple.share-services`
extension. Both compile the shared model/store and use the same configurable App Group entitlement.
The extension uses a normal `UIViewController` principal class, `NSItemProvider` text/URL loading,
local edit/review, and `NSExtensionContext.completeRequest`. It does not call `UIApplication.shared`,
walk the responder chain, or attempt to force-launch its containing app.

Incoming provider content stays in memory. Text identifier redaction is applied before the editable
preview: emails, phone-like numbers, handles and embedded URLs are covered. A deliberately selected
single web URL retains its address as a local reference, with credentials, query and fragment removed.
This is not semantic anonymization: the owner must review names and URL path details. If editing
introduces new identifiers, Save first updates the exact clean preview and requires another tap.
Only **Save reviewed draft** writes this curated draft, never the original provider object, file,
image or metadata. There is no extension networking, analytics or automatic background upload.

The App Group inbox uses one UUID JSON file per draft, atomic writes, `NSFileProtectionComplete`,
backup exclusion, a 50-draft limit and bounded reads. If App Group access/signing is unavailable,
saving fails visibly; it does not silently fall back to a disconnected private folder. The containing
app lists drafts and deletes only when the user explicitly confirms. Drafts remain after delivery
because no website-completion handshake exists. Deleting a local draft cannot undo a completed cloud
import; existing Mirror Room controls govern imported facts.

The primary delivery button uses SwiftUI `openURL` to the system browser, which is preferable for
the current browser-based SpacetimeAuth magic-link flow. Optional `WKWebView` preview uses a separate
website login session and allows only HTTPS navigation; cross-browser magic-link completion remains
unverified. The website's owner-authenticated review/import remains the final gate.

## Build on a Mac

1. Install Xcode and XcodeGen from their official sources. Run `xcodegen generate` inside `ios/`.
2. Open `MirrorvilleCompanion.xcodeproj`. Set your actual Development Team, a unique
   `MIRRORVILLE_BUNDLE_PREFIX`, and a registered `MIRRORVILLE_APP_GROUP` for **both** targets. The
   shipped `com.example.mirrorville` identifier is a configuration default, not an existing account.
3. Enable the exact App Group capability on both app identifiers/provisioning profiles. Confirm
   expanded Info `MirrorvilleAppGroup` and entitlements match. App Group availability depends on
   the developer team's signing capabilities; there is no bundled signing identity.
4. Keep `MirrorvilleWebsiteURL` at a verified deployment containing the receiver. Native delivery
   permits only the exact Pages base and current explicitly listed preview base in `ShareDraft.swift`.
   To replace a temporary tunnel, update that explicit allowlist and the app Info value together;
   no wildcard hosts or arbitrary redirect destinations are supported.
5. Build/run the containing app on an unlocked test iPhone. In Notes/Safari use Share → More to
   enable **Save to Mirrorville**. The extension saves locally and closes; open Mirrorville manually
   to deliver. No extension-to-app auto-open is promised.

Suggested build check on the Mac (adjust signing settings/device as appropriate):

```sh
cd ios
xcodegen generate
xcodebuild -project MirrorvilleCompanion.xcodeproj -scheme MirrorvilleCompanion \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

## Handoff protocol

The rich native handoff is `#mirrorville-share=<base64url UTF8 JSON>`:

```json
{"type":"mirrorville.share","version":1,"kind":"text","text":"Reviewed material","source":"iphone_share","createdAt":"2026-10-25T12:00:00Z"}
```

Decoded JSON is at most 16,384 bytes and text at most 12,000 UTF-16 code units. Native encoding strips
base64 padding and changes `+`/`/` to `-`/`_`. The simpler Shortcuts handoff is
`#mirrorville-text=<percent-encoded text>`. Neither route places the material in query parameters.
The receiver clears recognized fragments immediately and treats `createdAt` as receipt time,
**not** the date of narrated events; it must not promote this to import `latestAt`. Source metadata
is a transport label, not cryptographic authorship proof. Links are not fetched.

## Acceptance boundary

Cross-platform static/configuration checks do not compile or execute Swift. Required Mac/device
acceptance: generate/build both targets; verify App Group signing; receive selected English/Chinese
text and one URL; reject image-only/file/app-scheme input; review redaction and edits before save;
verify missing group/locked protected storage errors; reopen inbox; deliver through actual website
login; cancel without cloud import; verify explicit delete; ensure drafts remain after merely opening
the browser. Photos, camera/OCR, voice capture/transcription, universal links and automatic posting
are outside this first text/link implementation.

Apple references: [Share extensions](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/Share.html),
[App Group entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.application-groups),
[complete file protection](https://developer.apple.com/documentation/foundation/fileprotectiontype/complete).
