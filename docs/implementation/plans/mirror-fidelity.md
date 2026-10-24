# Plan: mirrors that read like their owner

Serves the premise (people must feel the mirror is them) and the two core contradictions: does the
mirror resemble its owner, and can small talk turn into a judgment of fit. Start after `yw/diary` is
merged into `main`; work on a new branch off `main`. Parts A and B touch the importer and Mirror Room
only, so they can run alongside the demo-path plan. Part D touches the importer and line writing.

## Why now

The owner imported their own AI-assistant chats and a WeChat export into mirror "mixian" (38 cards).
They found the cards broadly accurate, and WeChat added what the AI chats could not (humor with
friends, board games, arranging gatherings). It also showed where the importer itself is now the limit:

- **Recent is not dated.** WeChat messages from July–August 2025 produced a *recent* card about plans the owner
  finished a year ago.
- **Cards only pile up.** Every import appends 3–8 cards and never merges. Humor now has four cards,
  three of them about being blunt with AI tools; core has nine. At 38 of the 40-card cap, the next
  import is mostly dropped without telling the owner.
- **AI-only scenes leak into personality.** Being blunt or swearing at a slow tool became Humor and
  Core cards ("rage at slow, opaque systems"), which strangers can see. How someone talks to software
  is not how they treat people.
- **Size doesn't matter.** 3,793 WeChat messages yield as many cards as a small file, and the larger the
  input, the more generic the cards ("technically sharp", "reflects on their own habits").

## Scope

### A. Import quality (do first)

1. **Merge per facet.** The import prompt receives the mirror's existing cards and returns the full set
   it should have afterwards, at most 2 cards per facet (12 total for six facets), each marked `keep`,
   `rewrite` (with new text) or `new`, plus which existing cards to drop. Cards with
   `editedByOwner = true` are never rewritten or dropped. Apply the result in one transaction, keep the
   previous text in `previousText` so undo still works, and tell the owner what changed ("Humor: 3
   cards merged into 1"). The 40-card cap stays as a safety limit only.
2. **Date the recent facet.** Parsers return the date of the newest message they kept (WhatsApp and
   WeChat CSV both carry timestamps; pasted text has none). `importText` takes it as an optional
   `latestAt`. If the newest message is older than 60 days, the prompt is told so and must not write a
   `recent` card; it may describe the same thing in the past tense under another facet. With no date, no `recent` card from pasted text unless the text says
   it is current.
3. **AI-only scenes don't feed Humor or Warmth.** When every message in an import was written to an AI
   assistant (the exported files say so in their header; add an explicit `scene: 'ai'` flag rather than
   detecting text), the prompt may only write `core`, `professional`, `interests` and `recent` cards,
   and only about what the person works on and how they think, never about their temper with tools.
   Existing cards from AI-only sources in `humor` and `warmth` are dropped by the first merge (unless
   the owner edited them).
4. **Fewer, sharper cards.** Prompt rule: each card must name something specific (a game, a habit, a
   kind of problem) that would let a stranger start a conversation; generic traits ("technically
   sharp", "values honesty") are rejected. For large inputs, sample per conversation (cap per
   conversation, round-robin) before sending, so one group chat doesn't dominate.
5. **Auto-infer the relation.** Replace the relation dropdown with the scene each source already
   implies (WeChat group vs direct chat, AI assistant, pasted text = "other"). Keep a small "change"
   link for the rare wrong guess; nothing needs to be chosen before importing.

### B. Mirror Room readability

6. **A one-line summary at the top**, written from the current cards ("You plan carefully, joke dryly
   with friends, and are deep in game and social-tool projects"), regenerated after each import.
7. **Show the top cards first**: at most two per facet are visible by default after merging, so the
   room fits on one phone screen.
8. **Readable room chips**: on/off must be obvious without colour alone (✓ / ✗ or filled vs outlined);
   today `.room-dialog .chip.on` is nearly indistinguishable from off.
9. **"You", not "they"**, in the owner's own view. The stored text stays third person for other
   mirrors; the Mirror Room rewrites the pronoun for display only.

### C. From small talk to fit (needs a decision first)

These change 0004's evidence rule. The decision is drafted as `docs/decisions/proposed-graded-fit.md` on
branch `yw/proposals` (evidence from the conversation, personality never counts, good / maybe / none,
a "didn't click" line, and an eight-case eval set from the server log); start C once it is numbered.

10. **Needs and offers.** The import also extracts, per mirror, up to three "looking for" and three
    "can offer" items (private, shown in the Mirror Room, editable like cards).
11. **Graded fit with what didn't click.** After a conversation, the judgment scores fit on a few named
    dimensions (shared intent today, a need one can meet for the other, a specific shared interest,
    conversational ease), gives a grade (good / maybe / not this time), and writes one honest line on
    what didn't click. The diary shows the grade and both lines. This replaces "an exact phrase from
    each person" with "a reason traceable to each person's cards or needs".
12. **A small eval set.** Ten hand-labelled pairs from the demo cast and the owner's mirror ("should
    meet" / "shouldn't"), run against the judgment prompt after each change; record agreement in
    `docs/validation/`.

### D. Speaking like the owner

The owner read two of mixian's lines from the town ("future me is a stranger with bad memory", "group
project in denial is the most reliable genre of café table") and said they would never say either. The
content was theirs (their game level, their agent relay, their database course); the voice was the
model's default witty English. Cards say what a mirror knows, nothing says how its owner talks.

13. **A style card.** The same import call also returns a short private style card: sentence length,
    how direct they are, how they ask things, what kind of humor (if any), words or habits they use, and
    what they would never sound like. It describes, it does not quote; the raw text is still discarded
    (0005). Merged on later imports like the other cards.
14. **Example lines the owner marks.** The import also writes five short lines "you might say" in that
    style (new lines, not quotes). The Mirror Room shows them with ✓ / ✗; marked lines are stored with
    the style card. Owner choices are the strongest signal and are never overwritten by an import.
15. **Lines follow the style.** `writeLine` adds the style card, the ✓ lines as examples and the ✗ lines
    as "never like this", and drops anything that invites wit: "Talk the way your owner talks. Don't be
    cleverer or more polished than they are." Town lines stay in English for judges; the style carries
    over (short, plain, direct if that's who they are).
16. **The blind test.** Mix five of the mirror's new lines with five things the owner actually said
    (translated if needed); the owner and a friend try to pick the mirror's. Record how many they got
    right. Passing means they can't tell reliably.

## Not doing

A WeChat database reader or anything that needs a decrypted chat database (the existing PyWxDump CSV
parser stays as is, for testing with our own data; it is not a feature we present); three this-or-that
questions; chatting with your own mirror; voice; deep import tiers beyond paste and file.

## Accepted when

- Re-importing mixian's sources into an empty mirror yields at most 2 cards per facet, no `recent` card
  drawn from messages older than 60 days, and no Humor or Warmth card that comes only from AI-assistant chats.
- Importing a second file into a mirror with cards merges instead of appending, keeps owner-edited
  cards unchanged, and undo restores a rewritten card.
- The owner reads the new card set and the summary line and says it still sounds like them; record
  what they said, including anything they rejected.
- Mirror Room fits on a 375 px wide screen without scrolling past the summary to understand it; chip
  state is clear in a screenshot without colour.
- For D: the owner marks at least four of five example lines ✓ after one round of corrections, and
  the blind test is recorded.
- For C: the eval set agrees with the labels on at least 8 of 10 pairs, and a good-fit diary entry in
  the town shows a grade and a "didn't click" line.
- Typechecks pass; results recorded in `docs/validation/`.

## Gotchas

- Republish with additive migrations only (`.default()` on new columns); `--delete-data=always`
  wipes keys and the owner's imported cards.
- Imported data is the owner's own. Never commit exported chat files or databases, and never print
  message content in logs or validation records; counts and the final cards are enough.
- See `docs/HANDOFF.md` for publishing, `npm.cmd` and regenerating bindings.
