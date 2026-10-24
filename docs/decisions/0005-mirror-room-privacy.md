# 0005 Mirror Room: local redaction, facets, personal cards, per-room defaults

Status: Accepted (2026-10-24). Implemented for the Cal Hacks (venue) room; teammates and old-friends
rooms exist only as visibility settings.

## Choice

- **Import**: WhatsApp exports or pasted text. Parsed in the browser; the owner picks which speaker is
  them; only their own lines are kept; emails, numbers, links and handles are redacted before upload
  and again on the server. The redacted text sits in a scheduled job row only until it is processed.
- **Cards**: the model writes 3-8 conclusions (no quotes, nothing about other people), each with a
  facet (core, humor, warmth, professional, interests, recent) and a `personal` flag.
- **Defaults** (the owner never has to configure anything):

  | Facet | Cal Hacks / teammates | Old friends |
  | --- | --- | --- |
  | core, professional, interests, humor | shown | shown |
  | recent, warmth | hidden | shown |
  | anything flagged personal | hidden | hidden |

- **Overrides**: each card has a chip per room; clicking flips it, clicking back restores the default.
- **"That's not me"**: rewrite in your own words, undo, or remove; owner wording wins.
- The Mirror Room is a page ("how your mirror sees you"), not a settings modal.

## Why

Defaults decide what most people end up with (Johnson & Goldstein 2003, organ donation defaults), so
they have to be good, not "everything off, you choose". Merging the privacy filter with the Marglo
idea of a room where you watch how the AI understands you makes it a page people want to open.

## Consequences

Mirrors currently use cards visible in the venue room only.
