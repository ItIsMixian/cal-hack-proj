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
| Speech bubbles stay in screen coordinates, bounded to viewport width | Pass (desktop and 390×844 portrait) |
| Multiple owned-mirror selection | Unit/code path checked; interactive check Pending |
| LAN URL on host machine | Pass (Live; 11 mirrors) |
| Separate teammate device on venue Wi-Fi | Failed (timeout/ping failure reported); exact network cause unconfirmed |
| Temporary HTTPS Cloudflare link: guest reaches Live and 11 mirrors, including after reload/token refresh | Pass |
| Temporary HTTPS link: account login callback / teammate-device check | Pending; use guest for preview |
| Existing auth/diary/import/fidelity/roaming regression suite plus map checks | Pass (53 tests) |

No raw import/chat contents are included in this record. Runtime screenshots are kept outside
the repository. Owner aesthetic acceptance, separate foreground occlusion masks and obstacle-aware
pathfinding remain Pending; whole illustrated sprites do not supply those masks automatically.

## Movement correction (2026-10-24)

Projected server snapshots previously used unbounded exponential catch-up, amplifying the
nonlinear placement adapter into bursts of speed. Rendering now caps travel at 1.8 world units
per second, ties walking animation to distance, and limits a stalled frame to 50ms of travel.
Follow camera translation tracks the rendered character directly; sprite drawing no longer
rounds separately from the camera. Phone canvas backing scale is capped at 2 to reduce fill cost.
Build: Pass. Town suite: Pass (8 tests), including 30/60/120Hz motion and delayed snapshot cap.
Phone smoothness/owner visual acceptance: Pending, delegated to owner. This does not add
obstacle-aware routes; visual crossing of buildings remains a known placement limitation.

## Compact mobile HUD and conversation indicators (2026-10-24)

Default camera is General for accounts and guests. General now covers the viewport instead
of letterboxing the entire landscape; pointer/touch drag explores the cropped area. Updated
coverage regression passes. Follow still targets an owned mirror. Top title/account/exit share
a transparent row; clock moved above the smaller bottom dock; artwork credit remains in Guide.
World speech text is replaced with a 24px pixel bubble and three dots while conversationId is
active. Optional 10–14px pixel activity icons appear briefly, staggered per character, without
inferring emotional traits; reduced-motion users see no jumping icons. Full transcript remains
in the character panel. Build and 8 town tests: Pass. Mobile layout, dragging, readability and
owner aesthetic acceptance: Pending (owner requested direct phone/teammate validation).

## Building occupants and input sizing (2026-10-24)

Arrived mirrors in cafe/gym/food/workshop/lounge hide their walking sprite and receive a
stepped pixel portrait pin on the authored cafe/gym/restaurant/clock hall/farm. Indoor entry
requires arrival within the server venue plus completed visual catch-up; departure restores
the character. Outdoor park/street conversations retain sprites. Occupants receive stable
per-building pin slots, clickable through the same character panel; indoor conversation dots
remain visible. Follow view labels its owned indoor mirror. This is a client presentation
state, with no interior scene or database migration.

Desktop HUD has independent larger typography and 44–58px controls. General dragging now
accumulates every pointer delta and updates camera translation directly, removing the previous
lag from chasing an eased camera. Map bounds remain clamped. Build: Pass. Town suite: Pass
(9 tests), including indoor entry/catch-up/departure/outdoor guards. Phone dragging, desktop
visual sizing, pin crowding/picking and entry/exit appearance: Pending (owner validation).

Pin portrait correction: owner screenshot showed only the top of the hair because the 32px
sprite frame starts with nine transparent rows. Crop now starts at atlas y=41 (actual head);
the marker outline uses stepped rounded shoulders and a tapered point. Build: Pass. Updated
phone appearance: Pending (owner validation).

## Hanging clock and account menu (2026-10-24)

Clock is now a rope-hung pixel sign at top right. Native details/summary account menu contains
connection state, identity and sign-out/guest exit; keyboard Escape closes it. The resident
dock action and panel use the requested label 居民. Creation action is rendered only while
the current owner has zero mirrors; existing multi-mirror data and server limits are unchanged.
Production build/typecheck: Pass. Desktop/phone sign spacing, menu interaction and post-create
button disappearance: Pending (owner validation).

HUD follow-up: account Menu now sits in the bottom dock alongside Diary, Residents,
Mirror Room/creation and Guide; it opens upward. Resident action/panel labels use English
Residents after owner clarification. Top right is reserved for the hanging clock.
Build/typecheck: Pass. Phone/desktop menu spacing and interaction: Pending (owner validation).

Generated clock sign replaces the CSS plank/ropes. Built-in image generation used the existing
cafe and login signboard as style references. Transparent 1774x887 PNG retained; WebP delivery
is 111,596 bytes. Runtime time stays live over the blank face. Generation output inspected: Pass.
Production build: Pass. In-page desktop/phone placement and aesthetic acceptance: Pending
(owner validation). Full prompt/provenance: `public/assets/ui/README.md`.

## One-second snapshot pacing correction

Server cadence is 1Hz. Fixed-speed chasing could finish small projected steps early, then
stand still awaiting the next snapshot. A one-second snapshot playback now spreads each
update across frames, with existing speed/stall caps retained and no future extrapolation.
Walk animation uses elapsed moving time at 8 frames/second instead of distance-normalized
time at 5, with a 150ms idle grace to avoid phase resets at packet boundaries. Regression
checks a 0.36-unit step moves on at least 59 of 60 frames, stays within its endpoint and
retargets without snapping. Build: Pass. Town tests: Pass (10 tests). Phone FPS and subjective
smoothness: Pending; no CPU/GPU performance improvement is claimed without device profiling.
