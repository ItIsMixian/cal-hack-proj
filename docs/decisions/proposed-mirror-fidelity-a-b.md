# Mirror fidelity: merged imports and owner-facing summaries

Status: Proposed for teammate review; implemented on `yw/fidelity` under the owner's explicit authorization of Parts A/B of the main-branch mirror-fidelity plan (2026-10-24). Numbering remains on main.

This changes the import/readability portion of 0005, without changing privacy boundaries or 0004. Imports propose a complete collection, not an appended batch. Each facet has two slots; owner-edited cards are immutable and consume those slots. If historical owner edits already exceed two, preserve them all and expose overflow on demand rather than silently deleting owner work. Keep the 40-card total safety cap.

An explicit AI scene supports work/thinking/interests but cannot create or rewrite Humor/Warmth. The latest kept-message date gates new or rewritten Recent cards at 60 days; undated text must explicitly describe current circumstances. A dated human source can contribute interpersonal cards later. Existing personal cards cannot be silently declassified by a model merge.

Store a private second-person summary, expose it only through an owner-filtered view, and render owner pronouns without rewriting stored cards. Source metadata is inferred, with an optional change action. Card limits and date/scene guards are applied server-side even when the model ignores the prompt. Full replacements are transactional; if cards change while HTTP is in flight, fail the import without applying a stale replacement.

Raw imports remain transient and redacted. No graded fit, needs/offers, or Part C changes are included. Evidence: [validation](../validation/mirror-fidelity-a-b.md).
