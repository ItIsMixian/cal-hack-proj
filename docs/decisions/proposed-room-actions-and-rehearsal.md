# Room actions and contextual voice rehearsal

Status: Owner-authorized implementation (2026-10-24), unnumbered for teammate review. Supersedes the static overlay presentation of `proposed-scene-first-meeting.md`; extends the learning UI without changing principles.

## Choice

Onboarding and the existing room's desk/mirror entrances use a real client-side room journey. The reflection walks on authored floor routes, turns and animates, arrives at the writing desk to receive material, stays there while the real import runs, then walks to the mirror to rehearse. Camera motion keeps the relevant furniture and character visible. Actions are unavailable during movement; off-camera furniture uses directional wayfinding. The doorway completes entry into town. The character is larger in both the ordinary room and the journey, with its feet retained on the floor.

Naming is written on a physical tag near the reflection. Writing/pasting is on a ruled sheet at the desk. The mirror itself holds the short rehearsal and confirmation/edit stamps; a bottom source/destination form is no longer the primary interaction.

A newly created reflection is reversibly kept inactive during the learning sequence, preserving all data; the doorway activates it for town. Leaving the sequence with Close releases a newly created reflection as well. A page refresh during the sequence can leave it in Residents' away-from-town list; Bring back restores access to all saved learning data. Existing mirrors do not change active status just by visiting the room.

## Voice is a different check from facts

Factual cards still serve as factual/privacy review. Voice rehearsal now uses a concrete counterpart prompt, such as asking what the owner is working on or asking to hear more over coffee. An owner-authenticated procedure writes an actual model reply from the mirror's supported shared facts, private style and approved/rejected examples. It does not invent a learned voice when samples are missing.

The owner may approve the generated reply or deliberately rewrite how they would say it. Only after the explicit Keep my wording action is that authored correction saved as a private, approved expression example. This is intentional owner editing of a rehearsal, not retention of imported raw conversations. Identifiers are redacted. Owner-authored examples survive later imports and guide future rehearsals and normal line-writing prompts as delivery references, never evidence for new facts.

This provides a small-example calibration path without requiring bulk chat exports before the first try. It is not an assertion that a few examples reproduce the whole person. Real owner/friend assessment and the planned blind test remain necessary.

## Implementation

`RoomJourney.tsx` and `roomJourneyMath.ts` handle camera, grounded feet, route interpolation and directional sprite frames. `CreateMirror.tsx` controls arrival, material handoff, actual read status, mirror rehearsal and the door. Existing room furniture enters the same journey. `VoiceRehearsal.tsx` calls `tryMirrorVoice` and owner-only `correctVoiceTrial`; both reuse private `mirror_style` storage. No table schema migration, data reset, or new model training pipeline is required.

Evidence: `../validation/room-actions-and-rehearsal.md`.
