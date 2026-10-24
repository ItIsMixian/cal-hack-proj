# Plan: make importing the main way in

Serves the premise: a mirror only feels like you when it is built from your own words, and a
questionnaire gives scores many people share. Today a new mirror is built from the ten-item
personality check, and importing is a later step that needs a chat export most people don't have on
their phone. Turn that around.

Do it after Part A of `mirror-fidelity.md` (imports must merge before people import more than once).
It touches the same files (`src/MirrorRoom.tsx`, `src/importers.ts`, `src/CreateMirror.tsx`), so the
same person does both, one after the other.

## Outcome

Someone scans the QR code at the venue and, in under a minute on their phone, has a mirror built from
what their own AI assistant already knows about them. Someone with nothing to import can still make a
mirror in a few seconds, and it says honestly how little it knows.

## Scope

1. **"Ask your AI" import.** A button copies a ready-made prompt to paste into ChatGPT, Claude or any
   assistant with memory, and a box takes the answer back. The prompt asks the assistant to describe the
   user from what it knows: what they work on and how they think, interests, how they are with friends,
   what they have been doing lately (with rough dates), and what they are looking for or could offer
   someone. Only about the user: no other people's names, no contact details, health or money. The answer
   is imported as its own source ("Your AI's summary", relation `other`), **not** as the AI-only scene from
   `mirror-fidelity.md`, because it describes the person, not how they talk to software.
2. **Paste in one tap.** A "Paste" button reads the clipboard (`navigator.clipboard.readText`), with the
   text box as fallback when the browser refuses.
3. **Import first when making a mirror.** After the name, the first step is "Give your mirror something
   real": ask your AI (default), paste your own writing, or choose a file. The import runs right after
   the mirror is created, while the owner looks at the town.
4. **A quick fallback.** For people with nothing to import: pick three words that describe you from a
   short list of chips (e.g. slow to warm up, always tinkering, night owl, organizes the outings) plus one
   either-or question for extraversion ("At a party you'd rather meet someone new / stay with people you
   know"). The ten-item check moves to the Mirror Room as an optional "one-minute check" that refines the
   self-card. `createMirror` takes either; `buildSelfCard` works from the three words alone.
5. **Honest about thin mirrors.** A mirror with no imported cards says so in its room ("It only knows the
   three words you gave it") with a link to the desk. No progress bars, percentages or reminders.
6. Record the onboarding change as a decision when it lands (the personality check becomes optional).

## Not doing

Sign-in with Spotify, GitHub or other accounts; Web Share Target; an MCP server; reading chat databases.

## Accepted when

- On a 375 px wide phone, from opening the link to a mirror with at least five imported cards takes
  under 60 seconds, measured once with ChatGPT and once with Claude.
- The owner of a test mirror built only from the AI summary says the cards sound like them; record what
  they rejected.
- A mirror made with three words and no import walks the town, talks, and shows the "only knows" note.
- The optional check still updates the self-card; typechecks pass; results in `docs/validation/`.

## Gotchas

- The pasted summary is still redacted in the browser and on the server, and only conclusions are kept.
- `createMirror` signature changes: regenerate bindings, and keep the old TIPI path working for mirrors
  that already exist.
- Additive migrations only; see `docs/HANDOFF.md`.
