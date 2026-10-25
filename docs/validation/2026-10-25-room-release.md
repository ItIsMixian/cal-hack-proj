# Room and diary release

Owner requested Town exit label parity and publication of the tested room changes.
Release is based on origin/yw/map-assets at 1ec3221, retaining the departure prototype.
Includes the integrated room/source intake dependencies that were absent from the deployed
frontend, ordered resumable tour, open-book diary, original scroll labels including Town,
and chair-side path fix. Desktop Electron packaging is not included.

Maincloud mirrorville-yw9299-world updated with --delete-data=never; migration added
private learning/style/transfer/material tables, an input-kind default and owner views.
No existing table data deleted. Client bindings regenerated. Backend typecheck and
Pages-base frontend build passed. Release suite: 203/204 initially; missing source-only
iPhone setup document restored and all five iPhone tests passed on rerun. Earlier four
native-source failures were missing release-checkout files, not runtime failures.

Frontend publication and live asset verification recorded in the task after deployment.
