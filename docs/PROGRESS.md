# Current work

Goal: a demo where a judge makes a mirror, watches it live in town, reads its diary, and shows
interest in someone (see `core/principles.md`). Deadline: Devpost first submission Sun 2026-10-25 09:00 PT.

## Where things are

- What exists: `state/project-structure.md`. What has been checked: `validation/`.
- Why it is built this way: `decisions/` (0001-0008). Product thinking: `design/product-pipeline.md`.

## Next

1. Diary, visible interest, contact unlock and Mirror Room contact field implemented (0008); see
   `validation/0008-diary-and-mutual-interest.md` for acceptance results and remaining checks.
2. Public deployment (0007): first check that a Maincloud procedure can call DeepSeek.
3. Agree on the remaining drafts on branch `yw/proposals`: postcard privacy, CREAO team brief
   (`npm run check-decisions` lists drafts on every branch).
4. Anthropic key → validate the Claude judgment path (0002).
5. Pitch: demo script, video backup, Devpost page; collect real usage at the venue.

Ideas nobody has evaluated yet live in `backlog.md`. Branch and decision-numbering rules are in
`decisions/README.md`.
