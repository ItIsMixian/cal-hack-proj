# Existing character assets integration

Date: 2026-10-24. Branch: `yw/diary`.

## Change

Replaced the drawn circle faces with the team's existing Cup Nooble character PNG from `origin/yq` (`0936ced`). Atlas coordinates and the 5-fps four-direction walking sequence come from the teammate's `Player1.tscn`. The source PNG is unchanged; the original license and author credit accompany it. Color choices now distinguish foot rings and portrait borders. The same idle character appears in the Mirror Room and make-a-mirror preview.

The client keeps the existing server positions and smooth movement. Moving characters play the walk cycle; stopped characters hold the last facing. Feet determine draw depth; labels and conversation bubbles draw above characters. Click targeting covers the full sprite rectangle and removes stale mirrors from the position cache. An unavailable image falls back to the original circle face; reduced-motion preference holds an idle frame while positions continue updating.

## Checks

| Check | Result |
| --- | --- |
| Source and atlas verification | **Pass**: fetched `origin/yq`, inspected the original Godot animation definitions, decoded/verified the 128 × 96 RGBA sheet, and retained its readme/license. |
| Live town image loading | **Pass**: connected town displayed the existing eight mirrors as sprites; canvas reported `data-character-renderer=sprites`. |
| Selection and bubble placement | **Pass (controlled browser fixture)**: rendered the actual WorldCanvas at a fixed 960-pixel width with one stationary mirror and a bubble; clicking body and upper body selected ID 1, clicking empty map cleared selection. The bubble, name and foot ring were visible. A fixed fixture avoids a live character walking away between screenshot and click. No fixture rows were inserted into the database. |
| Mirror Room | **Pass**: existing Diary Alice still opened with saved contact; room heading exposed the new character image with the correct accessible name. |
| Create preview and marker color | **Pass**: the create dialog exposed the character preview; choosing Color 3 updated its border variable to `#5c6bc0`. Closed without creating another mirror. |
| Typecheck and production build | **Pass**: `npx.cmd tsc --noEmit -p .`, `npm.cmd run build`. |
| All four facing animations inspected individually, failed-image fallback, OS reduced-motion toggle | **Pending**: implemented from the source atlas/scene and code-reviewed, but not claimed as individually exercised in a browser. |
| Physical-phone character legibility at different device pixel ratios | **Pending**. |

The temporary fixed-position QA wrapper and click-debug attribute were removed after checking. No database/schema/bindings/auth changes or data-clearing publication are needed. Main, principles and 0004 evidence rules remain unchanged.

Screenshots: [live town](character-assets/town.png), [controlled selection and speech bubble](character-assets/selection-and-bubble.png), [Mirror Room portrait](character-assets/portrait.png).
