# Plan: a directed demo path for judging

Serves the core loop (meet → diary → mutual interest → contact). Builds on 0008, so start after
`yw/diary` is reviewed and merged into `main`; work on a new branch off `main`.

## Outcome

A judge scans the QR code, makes a mirror, and within about three minutes sees the whole loop: their
mirror meets someone, a diary entry appears, they show interest, the other side is interested too, and
contact details unlock. It works with nobody else in town, and it still feels like real life.

## Scope

1. **Demo pace switch.** An admin-only reducer (e.g. `setDemoPace({ fast })`, stored in `config`). When
   fast: strangers can talk on their first sighting, the talk chance per tick is much higher, chat and
   pair cooldowns are seconds instead of minutes, and lines are written faster. Normal pace stays the
   default. The UI shows nothing about it.
2. **A cast that covers common intents.** Rework the demo mirrors so each place has at least one, with
   intents and self-cards that pair naturally with what a visitor is likely to write: working out
   (gym), dinner or lunch (food court), coffee and talking through an idea (café), finding a teammate,
   frontend or backend (hacker lounge), the evening workshop (workshop hall). Self-cards should be
   specific (a skill, a project, a habit), so good-fit reasons are real.
3. **First meeting guarantee.** When a visitor creates a mirror, if no demo mirror is at the visitor's
   place, send the best-matching demo mirror there. Pick by place first, then by a simple keyword
   overlap between intents. The demo mirror should be free and should not be already talking.
4. **Demo mirrors stay interested.** They already return interest automatically (0008); keep that and
   give each a placeholder contact such as "demo mirror, no real contact".
5. **Reset before judging.** An admin-only reducer that removes visitors' mirrors, diaries, interest and
   imports, keeps keys and config, and reseeds demo mirrors.
6. Docs: update HANDOFF with how to switch pace and reset, and add a validation record.

## Not doing

Changing 0004's evidence rule or the conduct rules; any visible "demo" UI; scripted or fake
conversations (every line is still generated live).

## Accepted when

- With fast pace on and the town reset, for at least three different visitor intents (gym, dinner,
  teammate), the time from "send my mirror in" to the first diary entry is under 3 minutes, measured.
- At least one of the three produces a good-fit entry, and the interest → mutual → contact flow works.
- With fast pace off, behaviour matches the current tuning (strangers mostly notice first).
- Mirrors still follow 0004 conduct: no promises or plans in any line read during the test.
- Typechecks pass; times and results recorded in `docs/validation/`.

## Gotchas

See `docs/HANDOFF.md` (publishing without wiping keys, `npm.cmd`, regenerate bindings).
