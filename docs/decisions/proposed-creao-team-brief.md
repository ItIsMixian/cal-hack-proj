# Proposed: should a CREAO agent write a team brief after both wave?

Status: Proposed (2026-10-24). Conditional; adds the CREAO Team Empowerment track.

## Context

CREAO requires a CREAO agent (built at agent.creao.ai) to do core work, with its Agent ID and a run
share link in the Devpost README. Scoring weights: AI centrality 30%, depth of CREAO use 25%,
originality 20%, track fit 15%, demo 10%. A run can take minutes, so it does not fit live mirror
conversations, and Claude already owns the judgment steps (0002).

## Options

- **A. Team brief (proposed, if feasible).** After two people both wave, a CREAO agent reads what the
  two mirrors remember about each other and writes a brief: what each could cover for the other, a
  possible split of work, tracks that fit. It appears in their private chat. Waiting minutes is fine
  because it happens before they meet.
- **B. Skip CREAO.** Focus on Meta, Anthropic and SpacetimeDB.

## Proposal

A only if a 15-minute check shows a CREAO agent can be called from our backend (or a small relay) and
its result written back to SpacetimeDB. Otherwise B. It must also be part of the demo, not an add-on.

## Open

Calling API, auth, and whether the brief should only ever use what both people already shared (it
should, see proposed-postcard-privacy).
