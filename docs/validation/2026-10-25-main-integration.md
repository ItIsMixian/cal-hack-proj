# Main integration acceptance

2026-10-25. Merge integrated `yw/map-assets` at `7434dec` with `origin/main` at `de5be45`.

- Main-only changes were documentation/plans, including accepted 0009 and 0010.
- Resolved PROGRESS and decisions index conflicts by retaining implementation evidence and incoming decisions. 0010 remains unimplemented; its existing main-side amendment to 0004 is preserved, with no runtime evidence-rule change.
- Application, backend, desktop, scripts and deployment workflow are unchanged from the deployed integration code.
- PASS: production frontend build, backend TypeScript check, 252 Node regression tests, staged whitespace check.
- Existing bundle-size warning remains. No database publish/reset or secret changes in this merge.
- Pending checks from existing deployment/Anthropic validation remain Pending; this merge does not claim new browser acceptance.
