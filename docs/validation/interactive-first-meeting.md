# Interactive first meeting in a continuous room

Superseded by [room actions and contextual rehearsal](room-actions-and-rehearsal.md). This record documents the earlier overlay revision, not the current moving-character journey.

Date: 2026-10-24 (America/Los_Angeles). Branch: `yw/map-assets`, working-tree changes alongside concurrent guest-transfer and character-appearance work. This supersedes the initial form-style and split-scene interface evidence; the original data-flow validation remains in `import-onboarding-and-voice.md`.

## Implemented and checked

- First meeting is one continuous room at desktop and phone sizes. The reflection has an anchored speech bubble; responses, letters and appearance interaction share the same world. The former separate operation pane is removed. Existing authored room art is retained with a matching floor extension for tall phones.
- Creation presents one exchange at a time. A name-only first walk uses an honest empty self-card and neutral extraversion; no tag or personality questionnaire is required. Existing three-word and legacy creation APIs remain compatible.
- `WordOffering.tsx` handles the note -> receive -> envelope interaction with local redaction, chat-speaker selection, metadata/provenance, manual clipboard fallback and draft restoration. `WritingDesk.tsx` reuses it and follows actual subscription status.
- Fact review now presents one card, accepting or correcting it before advancing. Voice rehearsal presents one generated line, records yes/no and allows returning to the previous line. Optional personality questions, daily question and today's topic use individual exchanges. Advanced card/sharing controls remain available when explicitly opened.
- Setup prompts are scripted interaction copy; this does not add open-ended chatting with one's mirror.

## Automated evidence

`node --test scripts/test-*.mjs`: **98 passed, 0 failed**. New coverage includes actual first-meeting/letter UI callbacks for name-only departure, clipboard denial with manual entry, redacted AI-summary provenance, restoring a prepared letter, chat-speaker filtering and blocking a malformed replacement file. A server callback test verifies name-only creation invents no traits or import. Existing import, diary, auth, transfer, roaming, art, navigation and privacy checks remain passing.

`npm.cmd run build`: **Pass**. `npx.cmd tsc --noEmit -p spacetimedb/tsconfig.json`: **Pass**. Local module publication used `--delete-data=never`; there was no schema migration or reset for this UI revision.

## Browser / live checks

Codex in-app browser, desktop 1280px and mobile 375 x 812. Temporary QA origin `http://127.0.0.1:5190`; normal preview `http://localhost:5173`. Viewport overrides were reset after inspection.

| Path | Result |
| --- | --- |
| Single-room initial encounter, appearance click and current prompt | Pass; no scene/operation split, relevant scene controls stay available. Concurrent wardrobe changes retained. |
| Name -> materials -> note -> paste -> fold -> redacted preview | Pass with synthetic text. Fake email replaced by `[email]` before handoff. |
| Back from prepared letter -> choose a first walk | Pass; discarded material was not queued. |
| Name-only creation -> visible town | Pass. Synthetic mirror **17, First Meeting QA**, created without tags, questions or import. |
| No learned style -> honest invitation to bring own messages | Pass. |
| Desk -> own messages -> envelope -> actual model import | Pass. Synthetic own-message input yielded 6 cards and 5 generated style lines. No personal exports used. |
| One-card factual acceptance, correction and next card | Pass; owner correction saved and next card displayed. |
| One-line voice acceptance, rejection, next line and back | Pass; previous rejection remained visible on return. These synthetic selections do not establish owner voice acceptance. |
| Mobile presentation | Pass for current inspected beats: contiguous room, anchored bubble, no horizontal overflow, current controls readable, scrollable long letter exchange, visible keyboard focus and no bottom form panel. |
| Cleanup | QA mirror 17 reversibly moved out through owner-only UI. Other residents were not mutated. Normal preview retained; temporary test server stopped. |

Current screenshots (synthetic QA only):

- [Continuous room on desktop](interactive-first-meeting/unified-desktop.jpg)
- [Continuous room on phone](interactive-first-meeting/unified-mobile.jpg)
- [One-line voice rehearsal](interactive-first-meeting/voice-mobile.jpg)

Checked visual details: proportional scenery, visible character/bubble relationship, readable response controls, no shared paper-pane boundary, phone wrapping, focus indication, and reduced-motion CSS. Physical phone soft-keyboard, screen reader/controller behavior, true external ChatGPT/Claude timing, owner/friend voice acceptance, and final owner judgment of the visual experience remain Pending.
