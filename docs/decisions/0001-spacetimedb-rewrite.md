# 0001 Build from scratch on SpacetimeDB, no AI Town code

Status: Accepted (2026-10-24). Implemented.

## Context

The first prototype was a16z's AI Town (MIT) with our features on top. Cal Hacks organizers ruled that
pre-existing code is only acceptable as a dependency, and "if deleting the pre-existing code deletes a
majority of project, then it's not a dependency". AI Town was about 90% of that prototype.

## Choice

Rewrite everything during the event. Keep only real dependencies (React, Vite, SpacetimeDB SDK,
model APIs). Use **SpacetimeDB** as the single backend: tables, reducers, a 1-second scheduled tick,
and scheduled procedures that call model APIs over HTTP.

## Why

- Removes the rules risk entirely; history starts from our own first commit.
- The SpacetimeDB track describes exactly this: social experiences and AI systems coordinating in a
  persistent world state.
- One module holds world state, privacy (private tables + per-user views) and model calls.

## Alternatives

- Convex: already working locally and a $5,000 prize, but AI Town is built on Convex, which invites the
  comparison we want to avoid, and only one of the two can be the core backend.
- Godot: no C# web export, the official SpacetimeDB Godot SDK needs .NET, and heavy page loads on phones.

## Consequences

- Our town is simpler than AI Town (no pathfinding, embeddings or replay), which is fine for the demo.
- The SpacetimeDB CLI is only installed inside the agent's sandbox on the dev machine; see HANDOFF.
