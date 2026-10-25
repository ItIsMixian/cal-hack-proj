# Persistent browser login release

Requested by the owner: retain sign-in across refreshes and reopened tabs.

This release is based on b041fb7 and includes only browser session persistence and renewal.
The uncommitted room work and the broader local feature merge are not included.
OIDC user storage migrates from sessionStorage to localStorage for this authority/client.
Session mode persists per database; explicit logout clears the saved user and mode.
Expired saved users attempt silent renewal; interactive sign-in no longer forces prompt=login.
Guest identity remains separate and email verification is required.

Validation: 14 auth/session tests passed and the Pages-base production build passed.
Real-account refresh token rotation remains to be tested by the signed-in owner.
Storage remains scoped to the same browser profile and website origin.
