# Four letters on the same desk

At the physical desk, **Bring a letter** opens `SourceOffering.tsx` on the existing room paper.
Its four routes are Observe my computer, GitHub projects, My AI's introduction and My own update.
`CreateMirror.tsx` and the older `WritingDesk.tsx` use this same component. Each source previews
its material locally before emitting the existing `WordGift` contract and calling the same import
reducer. Actual subscription status still drives reading and walking to the mirror.

The AI/manual routes reuse `WordOffering.tsx` with separate mounted drafts while selecting another
source. External-source components unmount on Back, discarding their unsent preview and cancelling
pending GitHub reads. Closing the whole encounter discards drafts. If a handed-over letter fails,
the exact prepared text/source/date is available for an explicit retry or replacement.

## Direct desktop observation

The first route pairs with Mirrorville's own optional Windows helper. It has no Marglo installation
or export-file dependency. Start it locally from this repository:

```powershell
python desktop/observer.py --origin http://localhost:5173
```

Use the actual browser origin, without a path, when it differs. The UI's Find action checks the
fixed loopback service `http://127.0.0.1:17358`; a pairing code grants a memory-only session. The
helper starts paused, and collection requires Start observation. Browser page-topic derivation is
separately unchecked by default. Pausing, clearing clues and pausing, or disconnecting and pausing
are explicit controls. The helper can continue while the browser is minimized or closed, until
paused or quit; closing the paper aborts polling, not collection. Reopening requires pairing again.

The helper derives bounded project/document/topic labels locally from recognized foreground
windows. Raw titles are transient and never sent to the browser/database/model. No screenshots,
clipboard, keyboard or page-body capture is used. The browser polls authenticated status and
candidate endpoints every five seconds while this route is open. Stable clue IDs keep review
permission from bleeding when new candidates reorder the list; edited/reviewed snapshots do not
silently change during polling. Editing clears confirmation. App use is not proof of interest,
motive, project completion or an event outside the computer.

Candidates use the versioned [local observation format](marglo-package-format.md) for validation,
but no file export is required in this primary flow. Legacy Marglo package import/export remains
under My own update -> Other sources for compatibility. It does not drive the native helper.

Browser local-network access may require a permission prompt, and public HTTPS-to-loopback access
depends on browser policy. If blocked, use the configured local development origin. No Vite/tunnel
proxy exposes the loopback companion. Security checks are enforced by the helper as well as CORS.

## GitHub

The owner enters their public GitHub username/profile URL and declares that the account is theirs.
No developer app or access token is required. Bounded public API reads produce owned non-fork
project metadata and eligible own-account recent events; private repositories and other people's
comments/PR prose/commit messages are not imported. Public lookup does not verify ownership.

Each piece can be selected and edited before the redacted exact letter is handed over. Dates
describe recorded actions or repository creation; they do not establish the date of an unrelated
event described in text. An old project remains background. Rate limits, errors and empty accounts
are visible; no fake successful import is substituted.

## Shared privacy and scope

Dates use written-out month names so the existing phone-number redactor does not destroy them.
Desktop/GitHub letters carry per-item source/date headers through the existing import pipeline.
The creation reducer's status label still says `Your own messages` for facts; the letter itself
retains provenance. Existing-mirror imports receive the adapter's source label. The backend treats
these as owner-supplied material, not cryptographically verified external evidence.

The fourth route currently supports deliberate text and existing writing/chat files. Photos/audio,
arbitrary portfolio crawling and automatic cloud synchronization are pending capabilities, not hidden
uploads. No data is sent merely by choosing a source, and no auto-sharing/privacy defaults change.
Local desktop capture is ongoing when enabled; transfer of selected reviewed clues to the existing
server import pipeline remains explicit.

Decision: [four-source learning](../decisions/proposed-four-source-learning.md).
