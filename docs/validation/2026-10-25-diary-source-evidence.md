# Diary source evidence validation — 2026-10-25

Scope: prompt boundaries, server-selected shared source excerpt and diary rendering. No database schema change; no backend deployment performed for this feature.

- `node --test scripts/test-diary-evidence.mjs scripts/test-diary.mjs scripts/test-diary-comments.mjs`: 50 passed, 0 failed.
- `npx tsc --noEmit -p spacetimedb/tsconfig.json`: passed.
- `npm run build`: passed; existing bundle-size advisory remains.
- Synthetic browser preview: opening Alex shows the source excerpt separately from prose, while the people overview excludes metadata. Screenshot: `output/familiar-evidence/preview.png` (local ignored artifact).

Covered: unchanged allowed source, wrong-person and private IDs, changed/withdrawn sources, fake model suffixes, intent/topic labels, legacy/malformed metadata, existing diary behavior.

Not covered: live model generation, production deployment, target integration branch's multiworld adaptation. Prompt constraints cannot mechanically guarantee all prose is grounded. Source existence checks do not independently verify the owner's claims or prove relevance to the entire conversation.

Delivery: feature-only patch at `output/familiar-evidence/feature.patch`; excludes unrelated pending room, desktop, auth and world changes.
