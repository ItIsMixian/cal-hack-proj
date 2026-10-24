# Authored town and viewport camera

2026-10-24 · branch `yw/map-assets`, based on `yw/fidelity` (`d367cad`).

## Scope and evidence

- Imported teammate commit `329e7e8`, including the authored `Town map.tscn` layout,
  all 11 Sprite2D instances and both House/Decoration TileMaps (220 cells).
  Eleven PNG textures are unmodified; paths/hashes are in `public/assets/town/sources.json`.
- Full-screen game viewport; clouds are the authored border, with no extra rectangular frame.
  Follow centers an owned mirror; General fits the town. Multiple owned mirrors can be selected.
- Client-only placement adapter preserves the existing server data. Clock hall hosts Workshop;
  farm hosts Lounge as temporary venue mappings. Existing cards, profiles, principles and 0004
  rules were not changed. No database publish/reset was performed.

## Checks

| Check | Result |
| --- | --- |
| Production build (`npm.cmd run build`) | Pass |
| Original PNG SHA-256, scene order and all 220 decoded cell positions/atlas coordinates | Pass |
| Projection grid sweep: finite/in-bounds coordinates and continuous region transitions | Pass |
| Follow centers owner at desktop/portrait sizes; inverse camera transform round-trip | Pass |
| General fits world; no owned mirror falls back to General | Pass |
| Local browser: authored renderer, walking sprites, full viewport, no page overflow | Pass (1205×683) |
| General / Follow toggles change the live camera and selected button state | Pass |
| Character click opens frontmost character panel after zoom | Pass |
| Diary and Mirror Room entries remain usable | Pass |
| 390×844 viewport: HUD, dock and centered owned mirror visible | Pass |
| Speech bubbles stay in screen coordinates, bounded to viewport width | Desktop checked; final portrait recheck Pending |
| Multiple owned-mirror selection | Unit/code path checked; interactive check Pending |
| LAN URL on host machine | Pass (Live; 11 mirrors) |
| Separate teammate device on venue Wi-Fi | Failed (timeout/ping failure reported); exact network cause unconfirmed |
| Temporary HTTPS Cloudflare link: guest reaches Live and 11 mirrors | Pass |
| Temporary HTTPS link: account login callback / teammate-device check | Pending; use guest for preview |
| Existing auth/diary/import/fidelity/roaming regression suite plus map checks | Pass (53 tests) |

No raw import/chat contents are included in this record. Runtime screenshots are kept outside
the repository. Owner aesthetic acceptance, separate foreground occlusion masks and obstacle-aware
pathfinding remain Pending; whole illustrated sprites do not supply those masks automatically.
