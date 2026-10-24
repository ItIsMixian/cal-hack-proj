# Cup Nooble character sprite

Source: teammate branch `origin/yq`, commit `0936ced`, file:
`mirrorvile/ArtAsset/Sprout Sorry pack/Sprout Sorry pack/Tests/free_character_spritesheet_by-cupnooble.png`.

Author: **Cup Nooble**, Sprout Lands. Original terms are retained in `LICENSE.txt`.
The supplied Basic Pack terms specify non-commercial use, attribution, no asset-pack resale/redistribution, and no NFT/AI-training use; project/open-source distribution is allowed with the credit and terms. The PNG is copied unchanged. This directory is part of Mirrorville, not a redistribution of the complete pack.

The original `mirrorvile/Player1.tscn` defines 16 × 32 atlas frames:

| Facing | Source x | Idle source y | Walking source y sequence |
| --- | --- | --- | --- |
| Up | 0 | 32 | 0, 32, 64, 32 |
| Right | 32 | 32 | 0, 32, 64, 32 |
| Down | 64 | 32 | 0, 32, 64, 32 |
| Left | 96 | 32 | 0, 32, 64, 32 |

The original animation speed is 5 frames/second. The web renderer uses the same coordinates and sequence, chooses facing from actual smoothed movement, and keeps the last facing when idle. It renders with nearest-neighbour sampling. The original `look` colors identify mirrors via foot rings and portrait borders; this single sheet is one shared character appearance, not eight different outfits.

`src/WorldCanvas.tsx` renders the town character; `src/CharacterAvatar.tsx` uses the down-facing idle frame in the Mirror Room and creation preview. The map carries a visible author credit, and the repository README also credits the author. The Godot project itself is not merged into the web app.
