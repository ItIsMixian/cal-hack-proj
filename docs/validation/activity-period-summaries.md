# Time-period activity summaries — 2026-10-25

## Scope and source inspection

Owner asked to use the narrative quality of Marglo daily summaries, remove original-evidence
expansions and conversation checklists, then clarified that time-period grouping is preferable.
Read actual Marglo memory/daily_summary.py and skills/reporter.py; adapted the narrative prompt
and representative sampling, not private Marglo data or its self-persona.

## Verified

- Python 20/20 passed, including hour-boundary dwell splitting, owner-message event semantics,
  timestamped stable IDs, scoped report persistence, delivery receipts, stale-clear rejection and
  source settings. Existing observer and selected-Codex tests remain passing.
- Full Node suite 229/229 passed before the final sparse-period checkpoint test was added. The
  new checkpoint test and period-controller/client tests pass; final full-suite count below.
- Frontend/backend typechecks and production desktop UI/helper builds pass.
- Local backend narrative prompt published with --delete-data=never. No schema migration,
  cloud publication or public card-sharing change.
- Real DeepSeek procedure call with two synthetic owner messages produced a coherent Chinese
  time-period narrative, retaining the distinction between requested work and completion. Evidence:
  [synthetic model result](desktop-application/period-synthetic-model-result.json).
- Bundled helper QA, isolated temporary data, starts paused; one source connection and capture
  discovered 11 actual local periods and returned period model inputs. No actual owner input was
  sent to the provider. Clear removed period inputs and summaries. Temporary QA storage removed.
- Browser fixture used actual components/styles and synthetic narrative data. Previous/next moves
  between 08:00–09:00 and 09:00–10:00. Handoff acknowledgement changes visible status to handed-over
  and removes duplicate handoff action. No original source, evidence expansion or checklist appears.
  [UI preview](desktop-application/period-summary-preview.png). Handoff here uses a mocked reducer;
  real owner-account learning completion/quality remains a human acceptance check.
- Client tests verify only narrative/date crosses into ai_summary material; source excerpts do not.
  They cover unchanged-period delivery dedupe, revoked consent, retryable reducer failure and a
  cleared report not being handed over. Summary imports use existing owner-authenticated backend.

## Delivery and limits

Installer/portable/unpacked app generated in output/desktop-release-periods, separate from the
running old desktop app. Capture remains paused on restart, existing account storage/database is
preserved. The previous automatic approval rejection prevents automated relaunch; no bypass was
attempted. User should quit the old app and open the new build manually. This build adds hourly
periods, not adaptive topic segmentation or a day-aggregate view. Hidden-window Chromium timers
can delay refresh; the app must be running for observation and summarization.

Final full Node suite: 230/230 passed. Final installer and portable generated successfully;
checksums recorded in desktop-application/period-artifacts.json. Final source diff whitespace
check passed with CRLF-aware Git configuration. Windows user CODEX_HOME is configured and the
standard ~/.codex index also exists; manual launch can locate local Codex records.
