# A reflection learns by acting in its room

The first meeting and the existing room's learning entrances are client-side staged actions, not fixed character art behind operation panels. `RoomJourney.tsx` renders the authored 830 x 800 room and an actor with grounded feet, direction and walking frames. `roomJourneyMath.ts` routes it below the desk and to the right of the mirror/table. The camera follows the actor and settles on the furniture; tall phone viewports crop and pan the room rather than stretching the art or adding a lower menu area.

The initial name is written on the character's tag. On arrival at the desk, **Bring a letter** opens
`SourceOffering.tsx` on ruled paper: Marglo recent package, GitHub projects, an AI introduction or
the owner's own update. AI/manual writing reuses `WordOffering.tsx`; each source keeps local review
before explicit handoff. Handoff queues the real import; reading animation is tied to its actual
status. Completion sends the character to the mirror. Failed reading leaves the exact prepared
letter at the desk for retry. Raw import text is not used as a stored voice sample. See
`four-source-learning.md` for the source contract and current media/synchronization limits.

At the mirror, `VoiceRehearsal.tsx` asks for a live response to a concrete social prompt via `tryMirrorVoice`. The owner can approve it or write the reply they would actually give. Explicit confirmation saves the redacted authored correction privately through `correctVoiceTrial`; later imports retain it. The next attempt and normal town lines include these expression references without treating example content as new facts. Sparse data is presented as still learning, not a claim of voice fidelity.

The door is a world interaction: walk there, then step out. New reflections stay reversibly away from town while learning and activate on exit. Existing ones retain their prior status. Close and keyboard navigation remain available; reduced-motion settings accelerate the journey and disable extra decorative motion. Offscreen hotspots are not focusable/clickable; edge wayfinders trigger real movement. The enlarged character keeps the same foot anchor.

Detailed factual card/sharing review, diaries, contacts, and optional question/check flows remain separate room tools. This scripted setup is not open-ended chat with the reflection.

Decision: `../decisions/proposed-room-actions-and-rehearsal.md`. Evidence: `../validation/room-actions-and-rehearsal.md`.
