# Town and journal first visual version

## World navigator — 2026-10-25

The user requests their supplied floral timber UI at the top of Town Map, displaying
the current world name, five status dots and previous/next buttons. The current slot
is green, an existing unselected slot is white, and an uncreated slot is dark gray.
Buttons cycle through all five slots in both directions, including uncreated ones.

The frontend currently connects only the first slot, Mirrorville, to the existing town.
World 2–5 initially are empty slots with a plain dark-gray background and no map, characters,
clock or camera. Diary, Residents and mirror creation are disabled there. Per the user's
follow-up, Mirror Room remains enabled wherever its owned-mirror entry is shown, including
empty worlds and a disconnected cached session, and opens the same personal room. Returning
preserves the selected world. Guide and Menu remain available. Switching clears transient town panels and notices.
The title remains in English to match the existing UI. Small screens place the existing
clock/camera below the navigator to avoid overlap.

This initial version delivers frontend navigation only. It does not create worlds, invitations,
memberships, random discovery, server data isolation or cross-world travel. The existing
database connection/simulation remains active; a reload starts at Mirrorville.
See [actual checks and screenshots](../validation/2026-10-25-world-navigation.md).

### Owner settings preview — 2026-10-25

The user requests an owner-only Edit world entry in Menu for admission and capacity
settings, and explicitly chooses a frontend preview before real ownership/persistence.
Menu therefore includes a clearly labeled Preview as selector (World owner / Visitor).
The owner preview sees Edit world for existing preview worlds; visitor view and empty
slots hide it. This selector is a preview control, not authenticated ownership.

The panel edits world name (40 characters), optional introduction (240 characters),
Allow strangers to join and Maximum people (including the owner). Current preview
defaults/range are implementation choices: strangers off, 20 people, editable from
1 to 100. Save writes only this origin's browser storage per world ID and updates the
top nameplate; Cancel, Escape and closing discard the draft. Long title labels truncate
with an ellipsis and retain the full name in their title/accessibility text.

These settings do not enforce admission or capacity on the shared database. Actual
creator recognition, server writes, invitation checks, discovery and member counting
remain unimplemented. See [preview validation](../validation/2026-10-25-world-settings.md).

### Empty-world entry window — 2026-10-25

The user's next request adds a window in an uncreated world with two sections: entering
an invitation link, or creating a new world. The dark-gray background and top navigation
remain. Desktop uses two columns; narrow screens stack the sections.

Join a world has a URL input and Join world action. Blank input disables the action;
non-HTTP(S)/malformed input gets a validation message. A syntactically valid URL gets an
explicit invitation-preview notice: real joining is unavailable. No supplied URL is
visited, fetched or treated as proof of invitation acceptance.

Create new world opens the existing settings form in creation mode. Saving creates a
device-local preview in this slot and marks it existing, using the selected name. This
supersedes the initial four-always-empty slot behavior above. Previews reuse the map art
with zero residents and no shared diary/creation access; their settings can be edited
and restored from browser storage. Slot 1 alone shows live shared town data. Mirror Room
continues opening the same personal room from any slot.

There is no server world creation, membership, invite acceptance or separate simulation.
See [actual validation](../validation/2026-10-25-empty-world-entry.md).

Requested on 2026-10-24 alongside the interactive Mirror Room. The town uses the same sage, timber, cream paper and Pixelify Sans treatment. It remains a live view of the existing server simulation.

The six landmark regions keep their world coordinates and behavior. Scenery depicts open venues with different furniture, paths, trees and lanterns; it does not create collision or change navigation. Static art is cached once and repainted after fonts load, while the existing character loop handles movement, facing, depth, names and speech bubbles.

The webpage sidebar is replaced by a game action dock. Diary, the resident list, selected-mirror conversations and the guide open native modal game panels. The resident list also provides a keyboard and phone alternative to picking small sprites on the map. Mirror Room remains a dedicated room scene. Creation keeps its existing form with matching panel styling.

The diary is a paper book showing one conversation at a time, newest first, with date, location, mirror name, interest state and mutual contact intact. Newer/Older turns pages. An explicit selected entry ID anchors a page while new data arrives. Town diary includes the owner's mirrors; the room journal filters by current mirror ID. Reading either entrance clears the existing quiet unread indicator. There are no added notifications or automatic diary popups.

This first version uses editable local SVG/CSS and Canvas shapes, with the previously licensed character sprite. It adds no renderer package or new backend API. Evidence and privacy rules are unchanged. Physical phone legibility, map zoom and controller input are not part of this visual pass.

## General wheel zoom addition — 2026-10-24

The later authored-town General camera supports mouse-wheel zoom anchored to the cursor and pointer dragging. Its minimum scale covers the viewport; scale and position are bounded on every frame so zooming out or dragging to an edge cannot expose space outside the map. Maximum scale is four times the viewport minimum. See [implementation validation](../validation/2026-10-24-general-wheel-zoom.md).

## Comment-style diary addition — 2026-10-24

The current Diary replaces book pagination with a newest-first comment list. Each conversation
shows the other person's name, one sentence about the exchange and its date/time/place.
Historical notes use an existing concluding sentence; the local backend prompt requests a
single grounded reflection for future entries. Interest and mutual-contact behavior remain.
Town and mirror-specific entrances retain their scope. The new prompt is not yet published;
see [current validation](../validation/2026-10-24-diary-comments.md).

Diary comments now group under the other person's displayed name, showing the name once.
Groups follow the most recent exchange; notes within a group follow newest-to-oldest order,
each retaining its own date/time/place and existing interest/contact controls. See
[grouping validation](../validation/2026-10-24-diary-comments.md#grouping-by-person-2026-10-24).

Nearby continuous exchanges with the same person, own mirror and venue now form one comment
within a 30-minute total span. A venue change or wider span separates comments. The merged
comment uses the most recent existing reflection and shows the earliest/latest note timestamps
and exchange count. No original records are deleted. See [visit merging validation](../validation/2026-10-24-diary-comments.md#nearby-exchanges-in-one-comment-2026-10-24).

## Conversation content focus — 2026-10-24

The user's latest direction changes the diary's emphasis to what was discussed and which
things were mentioned. Each comment now lists concrete topic/detail sentences instead of
just a latest-person appraisal. Merged visits keep distinct content from all their notes,
with normalized duplicates removed. Names, venue/time ranges and interest/contact behavior
remain. Existing text is filtered without inventing missing content; future generation is
instructed to use transcript topics/questions/examples only. That prompt has not been
published. This supersedes the appraisal/one-sentence display described above; see
[current validation](../validation/2026-10-24-diary-comments.md#conversation-content-instead-of-appraisal-2026-10-24).

## Resident Status cards — 2026-10-24

Building portrait tags and Residents selection now open a Status card with name/avatar,
current activity and venue, plus recent exchanges between the selected resident and the
user's mirrors. The user explicitly chose this pair scope. Client defaults show up to 5
exchanges active in the past 7 real days, each with time/place, extractive source-content
highlights and expandable original dialogue. Empty history has no unrelated-public-chat
fallback. This replaces the original selected-mirror single transcript panel; see
[implementation checks and limits](../validation/2026-10-24-resident-status-card.md).

## Concise chat-only Diary — 2026-10-24

The user explicitly asks to remove unrelated simulation behavior and keep a concise summary
of the chat. This refines the previous content focus: a visit now has one paragraph of at
most two selected sentences, 50 words and 280 characters, rather than an expanding topic
list. Common scene actions, gestures, AI decisions and stage directions are removed from
legacy prose; mixed clauses can retain their spoken topic. Actual discussions about actions
(for example walking routes) remain valid content. Filtering is heuristic and cannot recover
missing transcript topics. Metadata and interest/contact controls remain separate.

Future generation is instructed to summarize only spoken content in 1–2 sentences, at most
40 words or 100 Chinese characters, selecting the main topic and one useful detail.
Summarization failure records an unavailable marker instead of narrating simulation activity.
The backend changes are local source only; see [validation](../validation/2026-10-24-diary-comments.md#concise-chat-only-summary-2026-10-24).

## Only content since closing — 2026-10-24

The user requests that Diary show only content since the previous close. Both entrances
filter source rows by `createdAt > lastClosed` before visit merging and summarization.
The boundary stays fixed while open, so new live summaries can appear without clearing
the current view. Closing town Diary advances every mirror; closing a mirror's room Diary
advances only that mirror. First use has no boundary and shows existing records; no new
content produces a quiet empty state. Close cutoffs persist per identity in this browser,
including pagehide/refresh while Diary is open. No historical rows are deleted. See
[validation and limits](../validation/2026-10-24-diary-comments.md#since-the-previous-close-2026-10-24).
