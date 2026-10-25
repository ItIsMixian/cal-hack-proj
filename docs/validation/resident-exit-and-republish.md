# Resident exit and renewed public preview

2026-10-24 · yw/map-assets.

Restarted original database data/JWT paths and frontend; created a replacement temporary tunnel.
Exact new login/logout callbacks saved after owner action-time confirmation (dashboard updated
19:09:26 PT). No end-to-end account/phone QA performed; owner requested direct device testing.

Added migration-default active=true at the end of mirror. Admin-only set_resident_active
reversibly exits/restores residents; exit ends active conversations, stops movement/social
participation and removes them from roster/map/owner mirror list. Data is retained. Removed
automatic demo seeding on init/reset. Profile/card/diary records are not deleted.

| Check | Result |
| --- | --- |
| Server typecheck and production client build | Pass |
| Regression suite | Pass (71 tests) |
| Admin authorization, reversible exit and profile preservation | Pass |
| Data-preserving publish --delete-data=never | Pass; appended active default only |
| Explicit system-demo ids 1–5 set inactive | Pass |
| Active system-demo count | 0 |
| Total active residents | 7, including test mirrors pending clarification |
| mixian id9 | Active; no direct profile/card changes |
| Owner/teammate phone and account flow | Pending |

Schema upgrade disconnects existing clients; refresh loads the new bindings. Tests/demo history
remains retained. Test-mirror retirement awaits owner clarification after their question about
what those accounts were for.
