# Quieter resident conversations

2026-10-24. Owner requested fewer unattended conversations.

- First conversation remains eligible after 45 real seconds; subsequent conversations
  require five real minutes after the last one ends.
- The same pair waits fifteen real minutes. Each resident can start at most three
  conversations in a rolling thirty-minute window, including currently active ones.
- Encounter attempt probability is reduced tenfold. At most two conversations may
  be active in town; existing conversations finish normally.
- No schema, stored conversations, diaries, resident identities or 0004 evidence
  checks are changed. The limits use real time, independently of the town clock.
- Working-tree pacing/roaming/diary tests: 29 passed; server typecheck passed.
  Four focused tests cover first contact, rest, both-participant budgets and expiry.
- Isolated staged-source checks: 24 pacing/roaming/diary tests passed and server
  typecheck passed (the shared working tree also contains teammate tests/features).
- Maincloud `mirrorville-yw9299-world` publication succeeded with `--delete-data=never`;
  migration plan contained no schema changes. Only the pacing patch was included.
- Local-server publication: Pending coordination with concurrent teammate backend work;
  local source contains the pacing update, but unrelated unfinished features were not published.
- Phone observation of the resulting rhythm: Pending owner/teammate validation.
