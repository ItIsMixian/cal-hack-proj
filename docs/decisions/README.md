# Decisions

Each record covers one question: context, choice, reasons, alternatives, consequences. Status is
Proposed / Accepted / Superseded; Accepted does not mean implemented, so each file also says whether it
is implemented. Later decisions amend or supersede earlier ones instead of rewriting them.

## How we work on decisions (two people, two branches)

- Everyone works on their own branch off `main` (e.g. `yw/postcard-privacy`) and merges through a PR
  the other person has looked at.
- A new decision starts **unnumbered** as `proposed-<topic>.md` with `Status: Proposed`. Drafts on
  different branches never collide.
- Numbers are only assigned on `main`: when both agree, rename it to the next free number
  (`0007-<topic>.md`), set `Status: Accepted (date)`, and add it to the table below in the same PR.
- Ideas that nobody has evaluated yet go to `../backlog.md`, not here. A Proposed decision is a concrete
  choice with alternatives that only needs agreement.
- Accepting a draft: merge its branch's PR, then in a small follow-up on `main` give it the next number.
  If both of you drafted the same question, settle it into one file before either is numbered.

## Accepted

| # | Decision | Implemented |
| --- | --- | --- |
| [0001](0001-spacetimedb-rewrite.md) | Build from scratch on SpacetimeDB, no AI Town code | Yes |
| [0002](0002-model-split.md) | DeepSeek for mirror chatter, Claude for judgments | Partly (Claude path untested) |
| [0003](0003-postcards-and-waves.md) | Postcards and mutual waves instead of popups and yes/no | Yes |
| [0004](0004-evidence-and-conduct.md) | Mirror conduct rules and evidence-checked connections | Yes |
| [0005](0005-mirror-room-privacy.md) | Mirror Room: local redaction, facets, personal cards, per-room defaults | Yes (venue room only) |
| [0006](0006-marglo-as-a-source.md) | Marglo is one data source among many | No |

## Proposed

Proposed drafts stay on their author's branch until accepted, so `main` only holds what both agree
on. To see everyone's drafts and spot clashes early, run `npm run check-decisions`: it fetches all
branches and lists, per branch, the decision and principle files changed since `main`, plus files more
than one branch is touching.
