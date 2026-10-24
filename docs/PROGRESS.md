# Current work

Goal: a demo where a judge makes a mirror, watches it live in town, reads its diary, and shows
interest in someone (see `core/principles.md`). Deadline: Devpost first submission Sun 2026-10-25 09:00 PT.

## Where things are

- What exists: `state/project-structure.md`. What has been checked: `validation/`.
- Why it is built this way: `decisions/` (0001-0008). Product thinking: `design/product-pipeline.md`.

## Next

1. Build the diary, visible interest and contact unlock (0008); contact details field in the Mirror Room.
2. Mirror fidelity (`implementation/plans/mirror-fidelity.md`): import merging per facet, dated
   recent cards, AI-only chats kept out of Humor/Warmth; then graded fit (needs a decision amending 0004).
3. Public deployment (0007): first check that a Maincloud procedure can call DeepSeek.
4. Agree on the remaining drafts on branch `yw/proposals`: postcard privacy, CREAO team brief
   (`npm run check-decisions` lists drafts on every branch).
5. Anthropic key → validate the Claude judgment path (0002).
6. Pitch: demo script, video backup, Devpost page; collect real usage at the venue.

Ideas nobody has evaluated yet live in `backlog.md`. Branch and decision-numbering rules are in
`decisions/README.md`.
