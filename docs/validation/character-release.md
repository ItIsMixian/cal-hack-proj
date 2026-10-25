# Selectable characters and full walk deployment

2026-10-24 (America/Los_Angeles). Owner authorized publication of the approved four character designs and frame animation.

## Scope

Built on production commit `4596621ff1dec11ed47a5587ee26772cb660bc25` on `yw/map-assets`. Adds original plus Rust/Sage/Honey/Coral to the existing online creation flow, shares their portraits with Mirror Room and roster, and renders their four-direction walk and indoor pins in town. The original `[0,1,2,1]` loop plays at 5fps. Existing look values 0–7 and backend contracts remain compatible.

The production creation screen remains its existing form, with actual character thumbnails replacing the old marker-color swatches. The local room-journey, guest-transfer, voice teaching and Facebook changes are separate ongoing work and are not part of this deployment. No backend schema, bindings, login configuration, database publication or data reset is included.

## Preflight

- `npm run build -- --base=/cal-hack-proj/`: Pass with production Maincloud/auth public identifiers from the existing workflow.
- `node --test scripts/test-*.mjs`: 82 passed, zero failed.
- Four delivery atlases: 128x96 PNG, 48 total frames, 34,356 bytes. Full arm/body/leg pose verification was run on the source implementation.
- Production preview at `/cal-hack-proj/` connected to the existing Maincloud town. Guest entry, creation modal, all five thumbnails and hosted-path asset loading passed. No resident was created during preflight.

## Publication

Target: https://itismixian.github.io/cal-hack-proj/ . Uses the existing GitHub Pages Actions workflow. Release commit: `15e9756933b1c770c182f417e02baa59ea72541b`. GitHub Actions run `40169358901`: build and deploy both succeeded.

Hosted checks: HTML HTTP 200 and references expected `index-DymirAuJ.js`; all four PNGs HTTP 200 and SHA256-equal to the approved release files. Actual public guest entry reaches Maincloud, creation displays all five choices, selecting Coral updates checked state, and each portrait reports character-ready=true with the `/cal-hack-proj/` hosted path. No browser console errors were observed during these checks. [Published screenshot](character-wardrobe/published.png).

Public verification did not create a resident, import personal data or exercise email magic-link login. Those were not needed for this frontend-only publication. The local room-journey and other ongoing features remain outside this release.
