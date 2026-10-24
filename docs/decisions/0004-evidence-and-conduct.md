# 0004 Mirror conduct rules and evidence-checked connections

Status: Accepted (2026-10-24). Implemented.

## Context

In an early run, a mirror promised its human would find a backend engineer and set "10am at a café"
on its own, and the judge called it a match because one mirror was "curious". Both were invented.

## Choice

Conduct (in every line's prompt): start from the moment, small talk first, be curious; only say what
the owner's information supports; never promise, plan, or offer intros; end when it has run its course.

Connections (after each conversation) count only for three reasons:

- `same_intent`: want to do the same thing today and it could happen together;
- `need_and_skill`: one person's intent asks for something the other's information shows they can do;
- `shared_interest`: specific, not generic.

The judge must copy an exact phrase from each person's own information. The server normalizes and
checks both phrases against that information and rejects the postcard otherwise. Except `same_intent`,
the pair must have talked at least twice. At most two postcards per person per day.

## Why

Postcards are only worth reading if they are rare and true. Code-checked evidence stops the model
from inventing reasons.

## Consequences

- Fewer postcards, by design; demos need enough time or demo mirrors with matching intents.
- Rejections are logged as `connection rejected for conversation N`.
