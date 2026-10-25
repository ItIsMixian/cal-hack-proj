# Town and journal first visual version

Requested on 2026-10-24 alongside the interactive Mirror Room. The town uses the same sage, timber, cream paper and Pixelify Sans treatment. It remains a live view of the existing server simulation.

The six landmark regions keep their world coordinates and behavior. Scenery depicts open venues with different furniture, paths, trees and lanterns; it does not create collision or change navigation. Static art is cached once and repainted after fonts load, while the existing character loop handles movement, facing, depth, names and speech bubbles.

The webpage sidebar is replaced by a game action dock. Diary, the resident list, selected-mirror conversations and the guide open native modal game panels. The resident list also provides a keyboard and phone alternative to picking small sprites on the map. Mirror Room remains a dedicated room scene. Creation keeps its existing form with matching panel styling.

The diary is a paper book showing one conversation at a time, newest first, with date, location, mirror name, interest state and mutual contact intact. Newer/Older turns pages. An explicit selected entry ID anchors a page while new data arrives. Town diary includes the owner's mirrors; the room journal filters by current mirror ID. Reading either entrance clears the existing quiet unread indicator. There are no added notifications or automatic diary popups.

This first version uses editable local SVG/CSS and Canvas shapes, with the previously licensed character sprite. It adds no renderer package or new backend API. Evidence and privacy rules are unchanged. Physical phone legibility, map zoom and controller input are not part of this visual pass.
