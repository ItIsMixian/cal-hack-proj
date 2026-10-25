# Mirrorville Marglo recent-activity package, version 1

This is a purpose-built local bridge, not a copy of Marglo's personality, memoirs or event store.
`scripts/export-marglo-package.py` reads the original `episodes` schema through SQLite `mode=ro`
and `query_only`, closes the connection, and creates a new local JSON file using exclusive creation.
It never starts Marglo, migrates its database, calls a model, or uploads anything.

```powershell
python scripts/export-marglo-package.py --data-dir "D:/coding warehouse/NextStep Seed_2/data" --out "recent.marglo.json" --days 7
```

The output parent directory must exist; an existing output is never overwritten. `--days` is 1–30.
The default payload aggregates only recognized application categories and foreground duration. It
never selects window titles, browser URLs, arbitrary event JSON, conversation text, user replies,
agent instructions, traits, daily model narratives or Marglo's own reflections. Unknown executable
names and executable paths are omitted. Duration is clipped to the selected window and each row's
elapsed time. This captures observed activity; it does not establish project progress or motives.

For meaningful project context, the owner may explicitly add:

```powershell
python scripts/export-marglo-package.py --data-dir "D:/coding warehouse/NextStep Seed_2/data" --out "recent-with-context.marglo.json" --days 7 --include-context current_projects this_week
```

Only the English/Chinese `Current projects` and `This week` sections of `context.md` are eligible.
They are undated background, always tentative: Marglo context can be maintained by the owner or by
the agent, and the exporter cannot attest line authorship. Existing `# ?` markers remain visible.
Basic contacts, links and Windows paths are redacted locally. Untagged names and sensitive prose
cannot be detected reliably; the owner must remove them in the browser before checking a piece.

No Marglo installation is required to create an empty format template:

```powershell
python scripts/export-marglo-package.py --template --out "empty.marglo.json"
```

This template contains no invented activity. An empty real package honestly reports that no
eligible activity was found. Users without Marglo can instead bring an AI summary or their own
words through the same room flow.

## Format and trust

```json
{
  "type": "mirrorville.marglo",
  "version": 1,
  "generatedAt": "2026-10-24T18:00:00Z",
  "items": [{
    "id": "context_current_projects",
    "kind": "background",
    "text": "Replace with your own real, shareable background.",
    "startAt": null,
    "endAt": null,
    "provenance": "selected_context",
    "status": "tentative"
  }]
}
```

This example is a format illustration, not captured personal data. Allowed kinds: `background`,
`observation`, `owner_statement`. Provenance: `selected_context`, `desktop_activity`, `owner_input`.
Statuses: `tentative`, `confirmed`; only explicit `owner_input` may arrive as `confirmed`.
Desktop observations require actual date bounds and remain `tentative`. Unknown fields, duplicate
IDs, unsupported versions, invalid/future dates, more than 60 items, more than 2,000 characters per
piece or a package larger than 256 KB are rejected. The package has no identity signature: labels
are source claims, not cryptographic attestation.

`MargloOffering.tsx` parses the file locally, starts every piece unchecked, allows editing, and
requires the owner to check each piece before handoff. Editing clears that confirmation. The exact
letter is re-redacted and previewable; only checked whole pieces fitting the 29,000-character budget
leave the browser. The 40-character minimum counts body text, not headers. Handoff uses existing
`WordGift`/`importWriting` with `inputKind=facts`, so it does not learn speaking style. Existing owner
authorization and room visibility rules still apply.

Individual date/source/kind headers use written-out UTC dates to survive the shared phone-number
redactor. Undated background stays `Date unknown`; `generatedAt` is never used as its event date.
`latestAt` is the latest actually included observation end date, or empty for undated material.
Date labels and an explicit observation caveat accompany the text; downstream model interpretation
still needs owner review and is not a guarantee against every inference error.

This is manual file transfer, not a new desktop observer or continuous sync. It has no dependency
on changing Marglo's original source repository. A future dedicated observer can produce this
same versioned contract after its sensing and privacy behavior are separately implemented.

Verification commands are `python scripts/test-marglo-exporter.py` and
`node --test scripts/test-marglo-package.mjs`. Their fixtures are synthetic; actual results and
remaining acceptance belong to the integration's `docs/validation/` record.
