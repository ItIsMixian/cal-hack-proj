# Town navigation, pacing and accelerated clock

2026-10-24 · yw/map-assets. No private message content in this record.

## Implemented

- Conservative 4px walk grid from terrain and authored sprite/tile alpha, with foot clearance,
  water exclusion and explicit tree/bench masks inside baked park art. Largest connected terrain
  avoids unreachable pockets. Weighted A* prefers roads; clear grass permits approaches.
- Rendered route playback consumes exactly 1.8 world units/real second across corners, with a
  50ms stalled-frame cap. New destinations replan routes; intermediate server position packets
  no longer change visual walking speed. Entry pins wait for server arrival plus visual arrival.
- Added private mirror_rest and world_runtime tables. 5Hz server movement scales distance by
  elapsed real time; social/LLM initiation checks run at most once/second. Arrivals stay 90–180s.
- Shared town clock advances 24 hours in 45 real minutes and drives display/routines/prompts.
  Real-date diary grouping, import recency, identity, 0004 evidence and daily caps are unchanged.

## Checks

| Check | Result |
| --- | --- |
| Server TypeScript typecheck | Pass |
| Production client typecheck/build | Pass |
| Regression suite, including navigation/timing tests | Pass (70 tests) |
| All 36 venue-pair paths and dense samples avoid blocked cells | Pass |
| Known building centers, park water and off-map cells blocked | Pass |
| Constant route distance at 30/60/120Hz and corners | Pass |
| 5Hz tick movement covers one unit in one second without multiplying social cadence | Pass |
| Arrival stays for deterministic fixture dwell before departure | Pass |
| Accelerated clock half-day and full-day wrap | Pass |
| Additive local publish with --delete-data=never | Pass; only two new private tables |
| Admin timer refresh | Pass; scheduled_at interval is 0.200000 seconds |
| Mirror count before/after publication | Pass; 12 / 12 |
| mixian id9 presence before/after | Pass; 1 / 1; no direct owner/card edits |
| Generated client bindings and rebuilt public preview | Pass |
| Phone feel, all decoration silhouettes and indoor pin appearance | Pending (owner/teammate validation) |
| Authoritative server collision / shared physical proximity | Pending; abstract server layout retained |

No reset, destructive publication or key replacement was performed. The older snapshot playback
helpers/tests remain as historical utilities; live rendering now uses TownNavigation routes.
