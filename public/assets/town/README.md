# Teammate-authored town scene

Imported from `origin/yq` commit `329e7e8` (`assets: update town map and scenery`).
`sources.json` records the full commit, original paths and SHA-256 of each unmodified PNG.
Regenerate from the repository root with `node scripts/import-town-scene.mjs 329e7e8`.

`scene.json` translates `mirrorvile/Town map.tscn`: all 11 Sprite2D instances,
their positions/scales/rotations/skews, and both House/Decoration TileMap layers (220 cells).
`Town-map.tscn` is an archival copy; its original `res://` paths refer to the teammate's Godot
project. It is not a standalone Godot project in this folder.

Three tile atlases are Cup Nooble's Sprout Lands assets. Licensing terms are preserved in
`LICENSE-Sprout-Lands.txt`; credit Cup Nooble. The eight illustrated PNGs were supplied by
the teammate; no additional license or authorship is asserted here.

The browser caches this layout at `(440, 310)` in 960×672 world coordinates. The viewport
fills the screen; General fits the town, while Follow smoothly centers a chosen owned mirror.
Forecourt
projection adapts the existing simulation to this artwork: café, gym, restaurant, park,
clock hall (workshop) and farm (lounge). These last two are temporary venue mappings.
No server positions, pathfinding or collision rules are changed. The illustrated sprites
remain whole images, so their internal trees/roofs do not provide separate occlusion masks.

Runtime delivery uses WebP derivatives from `python scripts/optimize-town-assets.py` (Pillow).
Dimensions and alpha are unchanged; tile atlases are lossless, illustrated sprites use quality 82.
Original PNGs and provenance remain unchanged. Delivery totals 1,365,282 bytes versus 11,255,664
original bytes. Failed loads show a retry control instead of displaying the old map.
