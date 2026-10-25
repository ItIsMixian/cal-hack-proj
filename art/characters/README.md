# Adopted Mirrorville character art

The owner approved `approved-fronts.png` in this chat on 2026-10-24 after iterating on proportions, hairstyles, accessories and simple two-color clothes. The four designs are Rust, Sage, Honey and Coral, left to right. These are the approved v8 fronts, not the rejected detailed garments or accessory-only variations.

`directions.png` supplies right/back/left views in four character rows. It was created using the built-in ImageGen tool with the approved fronts as its reference; the exact prompt is in `directions-prompt.txt`. Fronts in the game are sampled directly from the approved image, not regenerated from this directional sheet.

The reference is the team's original Cup Nooble sprite and the owner's in-game screenshot. Retain the existing Cup Nooble attribution and `public/assets/characters/LICENSE.txt`; this does not replace their terms or credits.

`scripts/build-character-atlases.mjs` mechanically crops at alpha >=128, resamples with nearest-neighbor to 21px character height, grounds feet at y=30 in a 16x32 frame, and creates three poses in the existing 128x96 atlas layout. The earlier foot-only step cycle has been replaced. `walk/{rust,sage,honey,coral}.png` contains distinct stride A / neutral / stride B body and limb poses generated with the original Cup Nooble atlas as the motion reference; exact prompts accompany each sheet. The builder samples the new arm/body/leg poses, retains every approved idle frame unchanged, and locks each approved hair/face to the original one-pixel head bob to prevent identity flicker. The generated direction grid has uneven row gutters, recorded in the script to avoid clipped feet.

Run with Node and `pngjs` available through normal module resolution or `NODE_PATH`. On this machine the bundled dependency directory is `C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`. No runtime package was added to the game.

Delivery files are `public/assets/characters/mirrorville-{rust,sage,honey,coral}.png`, totaling 34,356 bytes. The game never downloads the large source images in this directory.

`src/characterAnimation.ts` shares the original 5fps sequence `[0,1,2,1]` in town (the separate local room-journey implementation also consumes it). Stopping or reduced motion holds pose 1. No foot-strip shift is used in the new stride frames. `node scripts/verify-character-walk.mjs` checks frame bounds, locked head pixels and arm/body plus leg changes. `node scripts/preview-character-walk.mjs` creates the actual-atlas comparison GIF (original at left, then Rust/Sage/Honey/Coral; rows down/right/up/left). These utilities use bundled `pngjs` and `sharp` through `NODE_PATH`.
