# 0002 DeepSeek for mirror chatter, Claude for judgments

Status: Accepted (2026-10-24). Implemented in code; only the DeepSeek path has been exercised.

## Choice

- Every line mirrors say to each other: DeepSeek (`deepseek-chat`), cheap and high-volume.
- Judgments that can hurt people if wrong: Claude (`claude-opus-5-5`, low effort, server-side refusal
  fallback). These are turning imports into cards (what the mirror believes about you) and deciding
  whether two people have a reason to meet.
- Without an Anthropic key, judgments fall back to DeepSeek.

## Why

The Anthropic track asks for Claude doing "something that matters to the solution" while the team
knows "where it could go wrong for the people using it". Claude writing our code does not count;
it has to run in the product. Chatter volume is high, so cheaper models there.

## Consequences

- Calls are raw HTTP from synchronous SpacetimeDB procedures (`ctx.http.fetch`); no SDKs possible.
- Keys live in the private `config` table, set only by the publishing identity (`npm run set-keys`).
- Pending: set an Anthropic key and validate the Claude path.
