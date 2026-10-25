# Adopted selectable characters

Date: 2026-10-24 (America/Los_Angeles). Owner approved the v8 simple color-block designs in this chat.

## Implemented

- Original plus four selectable appearances: Rust (1), Sage (2), Honey (3), Coral (4). Existing `look` values and reducer contracts remain 0–7. Values 0 and 5–7 render the original sprite; existing rows with 1–4 now display the corresponding new design. No identity, profile or data migration occurs.
- `CharacterPicker` opens from the creation room's character or Choose character button, shows actual portraits and selected radio state, supports arrow keys and horizontal scrolling on narrow phones, and returns focus on Done. Selection is locked after creation/import is committed and when revisiting an existing mirror, so a local preview cannot misrepresent a saved appearance.
- `CharacterSprite`, room portraits, onboarding room actor, town walker and indoor roof portrait pins use the same atlases. Original fallback remains while loading or after failure. Retry is offered in the picker. Base paths respect Vite's deployment base.
- Approved fronts are resampled from the owner-approved image. Side/back views were generated against it. The initial foot-only step cycle is superseded by the frame animation follow-up below; reduced motion holds idle in room and town.
- Four 128x96 transparent delivery atlases total 34,356 bytes. Source art and build provenance are in `art/characters/README.md`.

## Evidence

| Check | Result |
| --- | --- |
| Typecheck and production build | Pass: `npm.cmd run build`. |
| Targeted loader, onboarding and room-route tests | Pass: 9/9 via `node --test scripts/test-character-sprites.mjs scripts/test-first-meeting.mjs scripts/test-room-journey.mjs`. Includes saved look payload, existing-mirror lock, hosted base paths, image failure, invalid dimensions and successful retry. |
| Atlas pixels | Pass: all 48 frames nonempty, contained within their 16x32 frames, soles at/before y=30, walking frames differ from idle. Verified with Pillow reading the actual delivery PNGs. |
| Desktop creation room | Pass: actual creation UI at 1280x720; selecting Coral updates the actor and portrait. Checked silhouette, palette, transparent edges, nearest-neighbor pixels, selected border and label legibility. [Screenshot](character-wardrobe/desktop.png). |
| Phone layout and keyboard | Pass: real app in a 390x844 iframe; horizontal options remain accessible, arrow keys select Coral, Done restores focus. [Screenshot](character-wardrobe/mobile.png). |
| Room travel | Pass: selected Coral walks to the desk and arrives facing away with matching hairband/outfit. Stopped before importing or creating a database resident. [Screenshot](character-wardrobe/room-walk.png). |
| Directions and step cycle | Pass: controlled browser preview of actual `CharacterSprite` in all 16 character/facing combinations, playback toggles between walk and idle. [Screenshot](character-wardrobe/directions.png). |
| Town and picking | Pass: actual `WorldCanvas` with synthetic in-memory residents displays four designs and an indoor portrait. Clicking Rust's body selects ID 1. No fixture rows inserted. [Screenshot](character-wardrobe/town.png). |

Physical phone testing, OS reduced-motion toggle, a real newly created resident surviving reconnect, and public deployment remain unverified in this change. Existing backend code, schema and bindings were not changed for characters; no database publication was needed.

## Follow-up: full walk poses (2026-10-24)

The owner requested the original character's frame-by-frame walk rather than the provisional foot-only cycle. Four new source sheets in `art/characters/walk/` provide distinct full-body stride A and B in all four directions, generated using the original atlas and accepted appearances as references. These are new-character pose adaptations, not identical copies of the original character's pixels. Source prompts are preserved beside the sheets.

The atlas builder samples the new limb/body poses, while retaining the exact prior idle pixels and reusing each approved head with the original one-pixel bob. `characterAnimation.ts` supplies the original `[0,1,2,1]` sequence at 5fps to both town and room. The previous 8fps town and distance-derived room cadence are replaced; navigation speed is unchanged.

- **Pass:** `npm.cmd run build`; existing Vite advisory about the main bundle exceeding 500KB remains.
- **Pass:** 11 targeted tests across `test-character-animation`, `test-character-sprites`, `test-first-meeting` and `test-room-journey`. Timing, stop, reduced-motion frame selection, loading/fallback, selection and routes pass.
- **Pass:** `node scripts/verify-character-walk.mjs` (with pngjs available) checks all 48 runtime frames: bounds/grounding, exact locked head pixels, and distinct body/arm plus leg pixels between strides.
- **Pass:** byte comparison against the previous delivery atlases confirms all 16 idle/facing frames remain unchanged.
- **Pass:** browser preview of actual `CharacterSprite` atlases played and stopped the new loop alongside the original. The comparison GIF is assembled directly from delivery atlases at 200ms/frame: [full animation](character-wardrobe/full-walk.gif). Left to right: original, Rust, Sage, Honey, Coral. Top to bottom: down, right, up, left.

No backend/schema changes or publication. Physical-phone motion, OS reduced-motion toggle and public deployment remain unverified.

## Import into the actual game room

Rechecked the current build at `http://127.0.0.1:5173/` through Make your mirror, Choose character, Sage, then the real room routes to desk and mirror. The actual DOM reported `data-character-ready=true` with `mirrorville-sage.png`; walking toward the mirror used `-96px 0px` and movement=true, and arrival held `-96px -32px` with movement=false. [Actual game screenshot](character-wardrobe/import-in-game.png). This was an unsaved onboarding preview: no resident was created and no imported personal text was submitted. All 48 atlas frames, five loader/timing tests, and the current production build pass. The production output includes all four atlas files. Public deployment remains outside this check.

## Public character release

The owner subsequently authorized publication. Four character designs, shared portraits and full town walk frames are live at https://itismixian.github.io/cal-hack-proj/ (commit `15e9756`, Actions run `40169358901`, success). The existing production creation form now shows five actual thumbnails; the local room-journey, voice, transfer and Facebook work is not part of this deployment. All four hosted atlases hash-match the approved runtime files. See `character-release.md` for the production-package tests and hosted checks; `character-wardrobe/published.png` records the live selection preview.
