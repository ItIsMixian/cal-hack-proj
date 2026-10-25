# Departure scene assets

Copied byte-for-byte from `yw/map-assets` commit `1ec3221908dfeb360bc34d8278c85c07baaf0352`, `prototypes/departure/assets/`.

- `houses.png` and `character.png`: existing Cup Nooble / Sprout Lands artwork; source license notices are included.
- `shuttle.png`: teammate-generated transparent shuttle for this journey.
- `font.woff2`: handed-off Pixelify Sans font; the integrated scene uses the application's existing Pixelify Sans face.

The original standalone preview and full provenance are preserved in `prototypes/departure/README.md`.
Production integration lives in `src/DepartureScene.ts`, `src/WorldJourney.tsx`, and `src/App.tsx`. No other source branch features were imported.
