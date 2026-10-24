# Proposed: layered disclosure, private conversations, and seeing only who you know

Status: Proposed (2026-10-24).

## Context

Mirror Room cards are only shown to their owner, but every card visible in a room goes to the mirror
in full, from the first meeting on. And conversation lines are a public table: anyone watching the
town can click a mirror and read everything it said. So in practice a card the mirror mentions is
published to everyone, and strangers get the same depth as old acquaintances.

## Proposal

1. **Conversations are private.** The full transcript is readable only by the two owners, inside their
   own mirror's diary. Nobody else can read it.
2. **You only see who you know.** On the map and in the side panel, what you can see about other
   mirrors depends on whether your mirror knows them:
   - your own mirror: everything (name, place, activity, its live speech bubble);
   - mirrors yours has met: name and activity; if two of them are talking, "A and B are chatting";
   - mirrors yours knows only one side of: "A is chatting with someone";
   - mirrors yours has never met: shown as passers-by with no name, no activity, no bubble. There is
     nothing to remember about them, so nothing is shown or stored.
3. **Disclosure deepens with the relationship** (social penetration theory, Altman & Taylor 1973),
   on top of the per-room visibility from 0005:

   | Relationship with this person | What the mirror may bring up |
   | --- | --- |
   | stranger | the public intent, surface interests |
   | talked once | plus how they work, skills, humor |
   | talked several times | plus what they've been up to, the warmer side |
   | mutual interest | contact details unlock; personal cards still only if the owner turns them on |

4. **Mirrors don't recite cards.** They bring things up when the conversation gets there, in their own
   words, like a person would.
5. **Mirrors only remember people they actually talked to** (already the case for relation notes);
   they keep nothing about conversations they merely passed.

## Consequences

- `line` stops being public; conversations are served through a per-owner view, and the map through a
  per-viewer view of mirrors (names, activity and "chatting" status filtered by the viewer's relations).
- The prompt for each line gets only the cards allowed for this room *and* this relationship level.
- Demo appeal shifts from reading everyone's bubbles to watching your own mirror live and reading
  its diary, which matches the core loop.
