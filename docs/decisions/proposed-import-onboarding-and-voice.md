# Import-first onboarding and private speaking-style calibration

Status: Owner-authorized implementation on `yw/map-assets` (2026-10-24); unnumbered for teammate review. Implements `implementation/plans/import-first-onboarding.md` and mirror-fidelity Part D. Human acceptance remains Pending.

## Choice and reason

The first creation path uses an AI summary or the owner's own writing, so the mirror starts with concrete facts. A reusable writing desk copies an assistant prompt, offers clipboard paste with a manual fallback, and retains the existing local chat filtering/redaction. AI summaries use relation `other`, distinct from chats addressed to an AI. Import preparation stays in browser memory; creation and queuing the first import are one transaction. The owner checks the resulting cards in the room and explicitly confirms them. The town remains visible while processing.

With nothing to import, three fixed self-description words and one extraversion choice create a thin mirror. The ten-item personality check remains compatible and moves to the room as an optional refinement. No invented detailed biography is inferred from this fallback.

Only explicitly identified own messages support style learning. AI summaries, AI chats, and unclassified writing files cannot produce style. CSV/WhatsApp parsers identify own messages; an unclassified text file requires the owner's explicit authorship declaration. A private style description and five newly generated English examples guide delivery, never factual claims. The server rejects direct sentence reuse, duplicates, and short fragments; a malformed style set gets at most one corrective model request, then the entire import fails without replacing cards. This enforces exact source-sentence exclusion, not a guarantee against every possible paraphrase.

Owner yes/no markings survive later imports. Owner edits to the style description override future inference. Only the speaking mirror's own style and choices reach its line-writing prompt; the other mirror's private style is never disclosed there. Generated examples are delivery references and cannot supply personal facts.

One optional room question per venue date sends a short answer through the dated merge pipeline. Skipping records only that the day's question was skipped; it adds no cards or import. A separate optional topic accompanies today's intent and expires at the venue's next midnight. Both use America/Los_Angeles calendar dates, independent of the accelerated town clock.

## Compatibility and limits

The original `createMirror` and `importText` reducers remain available. New private tables `mirror_learning` and `mirror_style`, owner-filtered views, and defaulted `import_job.input_kind` are additive. Local publication uses `--delete-data=never`; no reset is part of this work. Learning/style ownership follows the concurrent guest-to-account transfer implementation.

No graded-fit/Part C change, public deployment, external-assistant sign-in, or principle change is included. Real ChatGPT/Claude phone timing, owner factual/style acceptance, and a friend-assisted blind test cannot be inferred from synthetic QA. See `../validation/import-onboarding-and-voice.md`.
