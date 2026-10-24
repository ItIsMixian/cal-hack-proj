# Proposed: what may a postcard say about the other person?

Status: Proposed (2026-10-24). Raised while validating 0003.

## Context

The postcard to Tester described Marco as "quiet but funny". That came from Marco's self-card, not
from anything Marco's mirror said. So a postcard can pass on parts of the other person's private
information, which they agreed to give their own mirror, not to strangers.

## Options

- **A. Keep as is.** The judge reads both people's full information and may describe the other person
  freely. Warmest postcards; leaks private self-descriptions.
- **B. Only what is public (proposed).** About the other person, a postcard may use only their public
  intent and what their mirror actually said in the conversation (which anyone in town could already
  read). The judge still sees both sides' information to decide and to check evidence, but the
  other side's evidence phrase is never shown. Postcards describe your own side freely.
- **C. B plus their venue-visible cards.** Allows cards the other person left visible at Cal Hacks.
  More detail, but "visible to my mirror at Cal Hacks" is not the same as "quoted to someone else".

## Proposal

B. It matches the rule already used elsewhere: what's said aloud in town is public, everything else
stays with its owner.

## If accepted

Change the wrap-up prompt in `spacetimedb/src/index.ts` (`wrapUp`) to state the rule, and pass the
other side's transcript lines and intent separately from their private information.
