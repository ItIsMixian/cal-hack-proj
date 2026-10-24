# Plan: build 0008 (diary, visible interest, contact unlock)

Decision: [0008](../../decisions/0008-diary-and-mutual-interest.md). Work on branch `yw/diary`, merge to
`main` by PR. Read `AGENTS.md`, `docs/HANDOFF.md`, `docs/core/principles.md` first.

## Outcome

Instead of match-only postcards, every mirror has a diary its owner reads. Owners can show interest in
someone from a diary entry; the other person sees it; when both are interested, their contact details
(entered in the Mirror Room) become visible to each other.

## Scope

Backend (`spacetimedb/src/index.ts`):

1. **`diary_entry` table (private).** One row per mirror per finished conversation: `mirrorId`, `owner`,
   `otherMirrorId`, `place`, `text` (first person, 2-3 sentences, to the owner), `goodFit` (bool),
   `fitReason` (string, may be empty), `createdAt`. Written in `wrapUp` for both sides (skip demo
   owners' entries if useful, but demo mirrors still need entries about real visitors so the real side
   gets one). Reuse the existing wrap-up model call: extend its JSON with `diaryForA`, `diaryForB`.
2. **Keep 0004 conduct rules and the three connection reasons.** `goodFit` = the current
   "connection" verdict. Do **not** change the evidence check in this plan (0004 is under review);
   leave `supported(...)` as is.
3. **`interest` table (private).** `fromMirrorId`, `toMirrorId`, `fromOwner`, `toOwner`, `createdAt`.
   Reducer `showInterest({ diaryEntryId })`: owner of the entry's mirror only; one row per pair
   direction. Demo mirrors show interest back automatically (so one visitor can see the full loop).
4. **Contact details.** Add `contact` (string, max 120, redacted of nothing; it is meant to be shared)
   to `mirror_profile`, reducer `setContact({ mirrorId, contact })`, owner only.
5. **Views.**
   - `my_diary`: the owner's entries, newest first, each with `otherName`, `iAmInterested`,
     `theyAreInterested` (visible by design), `mutual`, and `theirContact` only when `mutual`.
   - Remove `my_postcards`, `my_human_messages`, the `wave` and `send_human_message` reducers, and the
     `encounter` / `human_message` tables, or leave them unused if removal is risky. Note which in the PR.
6. Respect 0003: no popups, no toasts, no expiry, no decline; ignoring interest sends nothing back.

Frontend (`src/`):

7. Replace the **Postcards** tab with a **Diary** tab: entries grouped by day, each showing place, time,
   who, the text; a quiet "good fit" mark; an "I'm interested" button; "<name> is interested in you
   too" when the other side is; contact details once mutual. The quiet dot stays for new entries.
8. Mirror Room: a "How people can reach you once you both say yes" field (contact), saved with
   `setContact`.

Docs (same PR): update `docs/state/project-structure.md`, add a validation record, a DEVLOG line,
and mark 0008 Implemented in `docs/decisions/README.md`.

## Not doing

Changing 0004's evidence rule, rooms other than Cal Hacks, notifications of any kind, withdrawing interest.

## Gotchas (from HANDOFF)

- Changing table columns needs `spacetime publish ... --delete-data=always --yes`, which wipes data
  **and the model keys**; the owner re-runs `npm.cmd run set-keys` afterwards. Say so before doing it.
- After changing the module: publish, then `spacetime generate --lang typescript --out-dir
  src/module_bindings --module-path spacetimedb`, then typecheck both `npx tsc --noEmit -p spacetimedb`
  and `npx tsc --noEmit -p .`.
- On the dev machine PowerShell needs `npm.cmd` / `npx.cmd`.
- Reducers must be deterministic (use `ctx.random`, `ctx.timestamp`); model calls only in procedures.
- Never commit `.env.local`.

## Accepted when

- A visitor's mirror talks to a demo mirror and a diary entry appears for the visitor, written in first
  person, with place and the other mirror's name.
- "I'm interested" on an entry about a demo mirror results in mutual interest and shows the demo's
  contact placeholder; the visitor's own contact is shown on the other side.
- Two browsers (e.g. `localhost` and `127.0.0.1`): A shows interest, B sees "A is interested", B shows
  interest, both see each other's contact. No popup appears at any point.
- Typechecks pass; results recorded in `docs/validation/`.
