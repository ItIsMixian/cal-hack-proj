# Departure animation prototype

2026-10-25. Standalone preview requested by owner, then requested for GitHub handoff to yq.

- Delivered in `prototypes/departure/`; no application routes, database schema or
  production entry flow changed.
- Local browser preview exercised selection and departure. Replay and destination
  controls observed; final window portrait and narrow-window layout inspected.
- Corrected two owner-reported issues: walking across the moving shuttle, and a full
  character hanging out of the window. Boarding now starts after the vehicle stops
  and its door opens; the in-window representation crops the head and clips to glass.
- Timeline invariant check: at 5ms samples throughout approach (2–3.65s), passenger
  is stationary and outside the shuttle's swept horizontal extent. Check passed.
- JavaScript syntax, all four shipped asset references, and absence of remote service
  requests in the preview: passed final packaging check.
- Full revised motion acceptance by owner: Pending. Real world selection, membership
  checks, joining failures and multiplayer transitions: Pending integration by the team.
- No personal data or account/model credentials are included.
