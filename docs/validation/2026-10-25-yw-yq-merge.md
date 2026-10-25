# yw/map-assets and yq integration

Date: 2026-10-25. Target: local `yw/map-assets`.

## Inputs and recovery

- Original local tip: `15e9756`.
- Previously uncommitted source, desktop, iPhone, authentication, voice and appearance work was
  saved as `69ad3f8`. The same commit is retained by `codex/pre-yq-merge-20261025`.
- The previously untracked server helper `spacetimedb/src/learning.ts` is included in the final
  merge tree as well; it is required by the saved onboarding/voice reducers.
- Fetched teammate tip: `origin/yq` at `d85c3ed` (including `5aa8501` and earlier authored assets).
- Private imports, export bundles, Python caches and TypeScript incremental files are excluded
  from the merge commit. Existing local artifacts were retained; no database reset was performed.

## Conflict decisions

Nine files conflicted: `App.tsx`, `MirrorRoom.tsx`, `PixelRoom.tsx`, `WorldCanvas.tsx`,
`pixel-room.css`, the server entry, diary tests, progress navigation and room design notes.

- Keep desktop/GitHub/AI/manual intake, iPhone shared drafts, guest transfer, voice rehearsal,
  appearance controls and shared animated characters from the local work.
- Keep teammate resident status cards/topic filtering, general-view wheel zoom, larger portrait
  pins, full-screen/pannable room, scroll nameplates, grouped chat summaries and last-close diary
  windows. The authored Godot source assets remain available.
- The room mirror shows its private summary, learning actions and contact editor. Voice rehearsal
  still enters the moving-character journey. The separate Address book/standing room resident are
  removed in accordance with the teammate room revision. Appearance stays reachable in the HUD.
- Preserve the whole local backend and transfer tests while applying the actual teammate diary
  prompt/failure-fallback changes; line-ending-only differences were not used to discard features.
- Update stale resident-status tests to the current topic-tag API and exercise View all exchanges
  before testing escaped transcript text. Stub only the sprite renderer in the server-render test.

## Verification

- `node --test` over every `scripts/test-*.mjs`: **194/194 passed**.
- `python -B desktop/test_observer.py`: **7/7 passed**.
- `python -B scripts/test-desktop-security-review.py`: **7/7 passed**.
- `python -B scripts/test-marglo-exporter.py`: **5/5 passed**.
- `npx.cmd tsc --noEmit -p spacetimedb/tsconfig.json`: passed.
- Production build passed again after the final room-HUD adjustments. Vite's main-chunk size
  advisory remains.
- Local browser checks confirmed the full-screen room, four furniture entries, appearance dialog,
  mirror summary, contact editor, and voice-learning entrance. The resident status card rendered
  live state and topic tags; the desk journey reached all four source choices. No
  contact/appearance/import was saved. [Full-screen room screenshot](yw-yq-merge/fullscreen-room.png).

## Scope

This is a local source integration, not a remote push, database publication or new deployment.
The backend diary-generation prompt takes effect only after a later data-preserving publication.
Native iPhone signing/device acceptance and owner judgment of generated facts remain pending as
documented in their existing validation records. Archived teammate documentation is preserved;
old timestamps/runtime notes in those records are not a claim of new acceptance.
