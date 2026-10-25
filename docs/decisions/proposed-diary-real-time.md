# Real-date diary and evidence-paced conversations

Status: Proposed for teammate review. Owner confirmed implementation on 2026-10-25 in this chat; not a two-teammate Accepted ADR and not deployed.

## Choice and reason

Town time controls atmosphere and movement, not the age or progress of human facts. Diary pages use real dates (current venue timezone: America/Los_Angeles), one mirror per page. Retain the existing extraction of spoken topics; add only the factual meeting frame, never invented emotions or human activities. Old pages remain available; previous-close cutoffs mark new content instead of hiding history. Interest and mutual-contact authorization remain unchanged.

Start with at most three conversation starts per resident per rolling 24 hours, and one start per pair per 24 hours. First meetings allow at most four utterances, later meetings six, with early ending allowed. Walking and sightings continue independently. Limits are ceilings, not quotas.

Repeat exchanges require additional shareable material compared with that pair's private material ledger. Existing pairs get a baseline opportunity on upgrade because no historical snapshots exist. Material is counted at conversation start, conservatively even if the model does not mention every fact. A failed generation therefore still consumes the attempt and material; retries are not automatically manufactured.

## Alternatives and limits

Timer-only chat produces repeated introductions and a busy log. Generating a fluent daily story from scratch adds unsupported transitions and feelings; this implementation assembles the supported meeting frame and existing chat summaries instead.

The initial novelty gate compares normalized text, not meaning: paraphrases can count as new, and unanswered questions without new owner material do not unlock another conversation. Priority routing to a relevant friend, semantic novelty, and separate real-friend/stranger policies are not implemented. The same material can be discussed with a different partner; it is not broadcast proactively.

The private conversation_material table stores already-shareable facts, never raw imports, and is not exposed through a client view. It is an additive schema change. No principles or existing Accepted ADR files are rewritten.
