# Mirrorville departure animation preview

Standalone local prototype for yq's world-selection flow. Open `index.html` directly
in a browser, keeping `assets/` alongside it. No npm install, account or backend needed.
Alternatively, from the repository root:

```powershell
python -m http.server 5189 --bind 127.0.0.1 --directory prototypes/departure
```

Open http://127.0.0.1:5189/ (use another port if occupied). Replay restarts the animation;
Skip opens the example destination selector immediately.

## Sequence and integration boundary

1. Leave home and walk to the stop, outside the vehicle's approach path.
2. Wait while the shuttle arrives. It stops at 3.4s and opens the door after 3.65s.
3. After 3.8s, walk around the stationary front, along its near side, and into the door.
4. At 6s, hide the exterior character and show only a clipped head inside a window.
5. Open the destination selector. Choosing an example plays departure and an end screen.

The example destinations are **not real worlds**. This does not create memberships,
connect to a database, implement invitations, or change the current application's entry flow.
The preview is deliberately independent of the multi-world backend design.

For integration, keep the animation's stopping point at `showMenu()`. Replace the
`[data-world]` buttons and their click handler with the real world-selection UI. The
current handler immediately sets `phase = 'departing'`; the application must instead
wait for backend permission/capacity checks and confirmed membership before doing so.
Keep the bus parked if joining fails. `reset()` returns to the beginning.

`boardingPose(t)` defines the character path; `drawBus()` owns the door and clipped
window portrait. These are separate from destination selection and can be ported to
the game's component/canvas implementation. Reduced-motion users go straight to selection.

## Assets

- `houses.png`: existing project `small_House_light_with_door_grass.png` atlas; first
  64×64 cell is used. Existing project art provenance remains in `public/assets/town/`.
- `character.png`: existing Cup Nooble / Sprout Lands character atlas. Sprite width
  is **16 pixels**, with 32-pixel row spacing; cropping 32 pixels wide shows two figures.
- `shuttle.png`: generated specifically for this prototype with the built-in image
  generation tool. Transparent cream/sage side-view shuttle; no API keys required to view.
- `font.woff2`: copy of the project's Pixelify Sans font.
- Source asset license notices accompany this folder. `preview.png` is a local browser
  screenshot of the selection/window-portrait state, not a substitute for animation.

Validation and remaining checks: [departure preview](../../docs/validation/departure-animation-preview.md).
