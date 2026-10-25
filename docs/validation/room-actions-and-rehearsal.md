# Room actions, scale and contextual voice rehearsal

Date: 2026-10-24 (America/Los_Angeles). Branch: `yw/map-assets`, working-tree changes alongside character-picker work. This is the current learning interface; it supersedes the static overlay evidence in `interactive-first-meeting.md`.

## Automated checks

- `node --test scripts/test-*.mjs`: **105 passed, 0 failed**.
- `npm.cmd run build`: **Pass**. Client typecheck and production bundle complete.
- `npx.cmd tsc --noEmit -p spacetimedb/tsconfig.json`: **Pass**.
- Regenerated client procedure/reducer bindings with SpacetimeDB 2.13. Published locally using the original publisher CLI config and `--delete-data=never`: **Pass**, no table migration/reset.
- Tests cover continuous route interpolation, exact destination, facing and no overshoot; arrival before material actions; explicit door confirmation before name-only creation; filtered material/privacy regression; owner-only live rehearsal and finite scene IDs; explicit redacted owner correction; stale index/text rejection; preservation of owner-written examples/provenance after a later import; and normal town-line prompts consuming approved delivery references.
- Callback tests use an in-memory context. Real subscriptions, model calls, motion and pointer behavior were additionally exercised below.

## Browser evidence

Codex in-app browser. Phone: **375 x 812**. Desktop: **1280 x 800**, plus initial desktop-sized preview. Final viewport overrides reset. Tests used a fixed production preview at `http://127.0.0.1:5194` after HMR interrupted an early run. The normal development/share preview remains on port 5173.

| Behavior | Observed result |
| --- | --- |
| Character size in ordinary home | Pass. Larger actor is visibly comparable to the desk/chairs; feet and name label were repositioned together. Phone screenshot below. |
| Name entry | Pass. Input is a small physical tag next to the actor, not a full-width field over the floor. |
| Entrance -> desk | Pass. Actor coordinates and facing changed across real animation frames; movement state disabled furniture actions, then desk stationery appeared on arrival. Sprite frames use the shared character renderer. |
| Materials on the actual desk | Pass. Own-message paper appeared over the desk. Fold/check -> handoff queued the real import; a received letter appeared on the desk and the character faced it while reading. |
| New reflection held in room | Pass. New synthetic mirrors were inactive while learning. Door exit activated the completed mirror; there was no reset or destruction of other data. |
| Failed read -> retry | Pass. One synthetic import returned Invalid merge response; original cards were retained, the letter remained on the desk, and the retry succeeded. This is a live-model variability case, not a guaranteed-output claim. |
| Read completion -> mirror | Pass. In the fixed build, a successful real import automatically initiated the route to the mirror, where the actor faced left and a contextual reply appeared. |
| Real voice simulation | Pass. Work prompt produced a reply about the synthetic rain-shelter/garden-game material, rather than an interest-label check. A coffee prompt produced a different conversational reply. |
| Owner wording -> next attempt | Pass. Explicitly saved a synthetic owner rewrite, then requested another situation. The private example remained approved/owner-written, and the next attempt used the updated context. This does not establish that the voice resembles a real person. |
| Mirror station and actor visibility | Pass after narrowing the mirror surface and moving the foot destination to the right of the mirror. The enlarged actor stays visible beside the rehearsal. |
| Phone offscreen navigation | Pass. Out-of-view furniture hotspots are disabled and directional controls initiate actual travel. An early locator click on an offscreen hotspot had closed the dialog; the final build was retested using visible wayfinders. |
| Door hit testing | Pass. Found the enlarged actor intercepting the doorway click; raised doorway hit priority and disabled pointer capture by locked actors. Keyboard Enter and, in the final build, mouse click both returned to town. Existing-mirror door exit also returns to town. |
| Existing room desk/mirror | Pass. Opening these furniture interactions enters the same moving-character journey, retaining the owned mirror ID and data. |

Synthetic QA mirrors: **Walking QA #19** and **Walking QA 2 #20**. The first run's page was reset by concurrent development HMR; its completed data remained saved while the mirror was inactive. The fixed-build second run completed desk -> read -> mirror -> correction -> another situation -> doorway -> town. After testing both QA mirrors were away from the active town, with all records retained. Other residents, including both existing mixian mirrors, were not mutated.

### Current visual evidence

- [Actual desk-to-mirror motion](room-actions/desk-to-mirror.webp): animated WebP assembled from every second frame of 100 actual browser captures over about 2.99 seconds; frame timing retained with a final hold. No synthesized walking or camera motion.
- [Enlarged character in the ordinary room](room-actions/room-scale-mobile.jpg)
- [Reading at the desk](room-actions/desk-reading.jpg)
- [Contextual mirror rehearsal on phone](room-actions/mirror-rehearsal-mobile.jpg)
- [Mirror rehearsal on desktop](room-actions/mirror-rehearsal-desktop.jpg)
- [Door arrival](room-actions/door-arrival.jpg)

The rehearsal screenshots and recording contain synthetic QA material only. The phone screenshot demonstrates scale, floor contact, desk/mirror context, and visible response seals. Long rehearsal/correction text can scroll within the mirror surface. The actor remains grounded during movement and camera follow; no lower source/destination form is used in this journey.

## Scope and remaining limits

- This is a text-voice rehearsal, not audio synthesis or a trained person-specific model. It uses supported shared facts, inferred style where available, and explicit approved/rejected/owner-written expression examples in the model prompt. A few corrections provide initial guidance, not proof of full imitation.
- Actual owner/friend voice acceptance and the planned blind test remain Pending. No synthetic QA click is counted as acceptance. AI-summary-only imports still do not infer the owner's voice; the owner can instead author a deliberate rehearsal correction.
- Imported raw chats remain transient. Only an explicitly confirmed correction is saved as a private authored delivery example. Rehearsal examples are not evidence for new facts about the owner.
- A refresh while a newly created mirror is held in the room can leave it in Residents -> away from town; Bring back recovers access to its saved cards/style. Unsubmitted browser drafts are not persisted.
- Physical phone keyboard/file-picker behavior, assistive technology/controller navigation, and an actual under-one-minute ChatGPT/Claude handoff remain Pending. Reduced-motion behavior is implemented but was not exercised by changing the user's OS setting.
