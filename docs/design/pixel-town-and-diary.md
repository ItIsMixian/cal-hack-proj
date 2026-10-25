# Town and journal first visual version

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
