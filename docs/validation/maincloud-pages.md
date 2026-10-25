# Maincloud and GitHub Pages deployment

2026-10-24. Free hosting path; no paid plan or domain purchased.

- Maincloud module published to `mirrorville-yw9299-world` with `--delete-data=never`.
  Owner account: `yw9299`. The pre-existing `mirrorville-yw9299-hyy77` database remains
  the SpacetimeAuth project anchor. Its initial empty module had no config row after
  an additive update, so the world uses a new database with normal init instead.
- DeepSeek key configured server-side without printing or committing it. A synthetic
  import completed with `import_status.status = done`: Maincloud outbound model calls pass.
  The validation mirror (cloud id 1) was then made inactive.
- Local `mirrorville` was not reset. Existing local residents, cards and ownership have
  **not been migrated** to Maincloud. In particular, local mixian id 9 remains local.
  Cloud account/guest ownership and existing local identity transfer: Pending.
- GitHub Pages configured for Actions, with `yw/map-assets` allowed to deploy.
  Target URL: https://itismixian.github.io/cal-hack-proj/ . The workflow builds with
  public Maincloud/auth identifiers only; no API keys or admin tokens enter the bundle.
- Assets and OIDC redirects support the Pages subpath. `404.html` serves the app for
  the callback URL, preserving its query parameters for OIDC validation.
- Local build and importer/fidelity/diary/roaming/navigation/scene/auth/share tests:
  73 passed. Added a verified-account callback test under `/cal-hack-proj/`.
- Hosted workflow run `40158293692` at commit `a7f3e04`: succeeded. Public HTML,
  hashed JavaScript/CSS, login button, town scene and all five room WebP assets: HTTP 200.
  Callback path returns the app shell through Pages' expected HTTP 404 fallback.
- Exact Pages auth callback/logout URLs saved with owner confirmation; dashboard
  Last Updated: 2026-10-24 20:36:10 PT. Existing localhost/tunnel entries retained.
- Phone account magic-link flow and two-device play: Pending (owner/teammate validation).

The Maincloud free allowance is metered; 5 Hz simulation and model APIs still consume
resources. No claim of unlimited free runtime. Keep the local preview as a fallback.

## Approved characters publication

Owner-authorized character/animation frontend update deployed at `15e9756` through successful Actions run `40169358901`. Public HTML and all four character atlases match the verified release; hosted guest entry and five-choice creation preview pass. Existing online creation/account/backend flows are retained; unrelated local room-journey/voice/import work was excluded. See `character-release.md` for exact scope and the screenshot. No database publication/reset was performed.
