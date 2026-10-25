# iPhone shared-item web receiver

The receiver is a deliberate input route, not phone surveillance. iPhone users choose text or a link
in the Share Sheet/Shortcuts, then open Mirrorville. The website receives a local draft and never
automatically gives it to a resident. It does not read other apps, browse history, photo libraries,
microphones, or shared page contents.

## Two compatible inputs

- Native companion: `#mirrorville-share=BASE64URL_UTF8_JSON`, with exact object fields
  `{type:"mirrorville.share",version:1,kind:"text"|"link",text,source:"iphone_share",createdAt}`.
- Manual iPhone Shortcut: `#mirrorville-text=URI_ENCODED_TEXT`. Apply URL/URI encoding once, not form
  encoding; a literal plus remains a plus. This route needs no Mac or signed app.

Only standalone fragments with those exact prefixes are consumed. OIDC callback query parameters
and unrelated/combined authentication fragments remain intact. `mobileShare.ts` enforces 16,384
decoded UTF-8 bytes, 12,000 text characters, exact schema/version/source, valid UTC dates without
future claims, and HTTP(S) links without embedded credentials. No query-string text or redirect URL
is accepted. Native links are redacted locally; only their hostname survives as source context.

Parsing is pure in `SessionRoot`'s state initializer, including React StrictMode's double call.
After mounting, the receiver clears its own fragment with `history.replaceState`; duplicate effect
execution cannot discard a received draft. Hash changes can deliver another item without reloading.
This reduces URL retention but is not a guarantee that browsers or OS sharing surfaces never retain
the original URL. Neither draft receipt nor preview fetches link contents or submits a reducer.

## Review and account ownership

A quiet arrival banner leaves the normal login/town usable. After guest/account entry the owner
chooses **Review shared item**, then explicitly selects a mirror from the owner-filtered
`my_mirrors` view. Missing/forged selection cannot submit. The existing `importWriting` reducer
still enforces `ctx.sender` ownership. Without a mirror, **Make my mirror with this item** opens the
existing room journey; its source paper includes **Shared from my iPhone** for local review.

Shared text requires a choice: the owner's own words about themselves, or an external reference.
A shared link is always a reference. References need a separate owner-written meaning note of at
least forty characters. The external quotation/URL stays local; only that note plus hostname/source
metadata is handed over. Own words require explicit confirmation that personal facts are true,
quoted experiences are not the owner's, and other people's details were removed. Edits and new
incoming items clear review approval. **Keep it for later** retains the pending memory draft.

Handoff is `inputKind=facts`, relation `other`, source `iPhone · shared item`. It never infers voice,
and `latestAt` stays empty: receipt/share time does not date a life event or prove that an article
was read/endorsed. Actual import/model correctness remains subject to factual review in the room.

Drafts normally live only in memory. If the owner chooses email sign-in, the visible banner explains
that a redacted draft is cached in this tab's `sessionStorage` for up to fifteen minutes solely to
survive that redirect. Restoration consumes the cache and resumes memory-only handling. Discard,
sign-out/leave and successful handoff clear it. Storage failure/expiry is handled honestly. A magic
link opening a different tab may not carry the draft: return to the original tab or share again.
No raw text/URL is written to localStorage or the game database by the receiver.

## Device and hosting acceptance

The receiver is usable in local development and the rebuilt production preview. A phone must open
an accessible HTTPS deployment/preview containing this build; `localhost` on the phone points to
the phone itself. Native sender configuration restricts its website host/base path; a manual
Shortcut can use the current owner-provided HTTPS preview base. The permanent Pages deployment
is not updated automatically by a local build.

See the native iOS and Shortcuts setup documentation under `ios/`. Swift compilation, signing,
installation and real Share Sheet/Shortcut behavior require separate on-device acceptance; static
source/parser checks do not establish those outcomes. Photos and audio are not supported yet.

Evidence: [receiver validation](../validation/iphone-web-receiver.md).
