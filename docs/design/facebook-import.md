# Facebook own-post letters

The desk's **My words -> Bring Facebook posts** source reads a bounded set of the owner's own
Facebook text posts into a local, editable preview. It reuses `WordOffering.tsx`, so first meeting,
existing-room learning journeys and the older `WritingDesk.tsx` all reach the same source. It does
not replace SpacetimeAuth, fetch friends' feeds, or run background synchronization.

`src/facebook.ts` lazily loads Meta's official JavaScript SDK only when the owner prepares this
connection. A second deliberate button opens Facebook Login synchronously, requesting
`public_profile,user_posts`. The browser checks granted `user_posts` and matches `/me` to the login
account. It reads `/me/posts` with fixed fields and cursor parameters: last 90 days, 25 rows per page,
at most five pages, at most 100 eligible posts. It never follows a returned `paging.next` URL.

Only dated owner-authored text survives. Posts with attachments, message tags, or generated stories
are excluded; no comments, photos or friends' feeds are requested. This intentionally excludes photo
captions and link shares in the first version. This filter cannot discover every untagged person
mentioned in prose: the owner can edit or deselect each post before the exact letter preview.
Post dates are retained as written-out UTC dates; these survive the existing contact-detail redactor.
A post date is evidence of publication, not proof that its narrated event happened on that date.

The letter contains whole posts, newest first, up to 29,000 characters; the UI states included and
selected counts. Edited bodies are redacted again before the exact preview and handoff. The minimum
40-character check counts actual body text, not source/date headers. Only explicit handoff calls the
existing owner-authorized import reducer. `inputKind=facts` conservatively learns background, not
speaking style. Individual source/date headers survive even in first creation, whose existing reducer
uses the generic `Your own messages` import-status label. Existing-mirror imports also receive the
`Facebook · own posts` source label. No new database schema or generated bindings are required.

Tokens and raw API responses are not sent to SpacetimeDB, logs, browser storage or model prompts by
this connector. The SDK retains its Facebook authorization context in browser memory; returning to
writing does not sign the person out of Facebook or revoke consent. Unmount aborts pending reads and
discards the local preview. Facebook authorization can be removed in Facebook's Apps and Websites.

## Owner configuration

No Facebook app is configured in this checkout. The visible source therefore explains that it is
unavailable and offers ordinary writing instead. To enable it:

1. Create/configure a Meta developer app supporting Facebook Login for Web and personal `user_posts`
   access. This is a separate app/source authorization, not the SpacetimeAuth client ID.
2. Configure the actual site domain, HTTPS Website URL and applicable JavaScript SDK login allowed
   domains/URLs in the Meta dashboard. For Pages the site is
   `https://itismixian.github.io/cal-hack-proj/`. Follow the dashboard's exact current requirements;
   localhost testing may have different restrictions from public HTTPS.
3. Set **public** `VITE_FACEBOOK_APP_ID` in local build env, or the same GitHub Actions repository
   variable for Pages. Optional `VITE_FACEBOOK_GRAPH_VERSION` defaults to `v23.0`; use a supported
   version compatible with the app. The deployment workflow passes both variables into Vite.
   Never put an app secret or access token in any `VITE_` setting.
4. Test first with an account assigned an appropriate app role. Broader public use depends on the
   app's available permissions, access level and Meta's applicable App Review/business verification
   requirements. A configured app ID alone does not establish public `user_posts` approval.
5. Supply the app's required privacy policy and user-data deletion instructions, then verify real
   grant, cancellation, permission denial and actual eligible posts on the target HTTPS origin.

References to check while configuring: [JavaScript SDK](https://developers.facebook.com/docs/javascript/quickstart/),
[Facebook Login for Web](https://developers.facebook.com/docs/facebook-login/web/),
[user_posts](https://developers.facebook.com/docs/permissions/reference/user_posts/),
[User posts](https://developers.facebook.com/docs/graph-api/reference/user/posts/).
These pages returned HTTP 429/inaccessible during implementation, so dashboard availability and
current approval requirements remain live acceptance items, not verified capabilities of our app.

Evidence: [validation](../validation/facebook-import.md).
