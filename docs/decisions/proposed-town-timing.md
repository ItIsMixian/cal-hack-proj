# Separate movement cadence, social decisions and town time

Status: Proposed for teammate review; preview implementation requested by owner on 2026-10-24.

## Context

Straight-line projection crossed illustrated obstacles. Small 1Hz position updates produced
stop/start walking. Random departure probability gave roughly 17-second mean stays, so mirrors
looked restless. The real-time clock also kept the short demo in one part of the day.

## Preview choice

- Client navigation uses authored solid-art masks, weighted streets/clear grass and constant
  1.8 world-unit/second arc-length travel. No direct path fallback through obstacles.
- Server movement runs at 5Hz with elapsed-time speed, while social attempts stay at most 1Hz.
- Rest 90–180 real seconds after arrival; conversations still have their existing cooldowns.
- Use a shared accelerated 45-minute town day for routines, prompts and display. Real time
  still governs diaries, import recency, account tokens and all 0004 evidence/daily-cap rules.

## Limits

The navigation mask is client presentation. Server social proximity still uses abstract layout
coordinates; this does not establish authoritative physical collision or an interior simulation.
Trees and benches baked into park art use conservative source-space masks. Asset changes require
regeneration and device visual review. Day length and stay range are tunable preview defaults.

Validation: `../validation/town-navigation-and-timing.md`.
