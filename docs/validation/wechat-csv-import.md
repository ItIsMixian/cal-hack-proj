# PyWxDump CSV import

2026-10-24, branch `yw/diary`. Extends the existing browser-side import pipeline from decision 0005.

## Observed format

Both local exports are UTF-8 (accepted with/without BOM). Columns are `id, MsgSvrID, type_name, is_sender, talker, room_name, msg, src, CreateTime`. The local PyWxDump source maps `IsSender == 1` to the current account and maps ordinary text to `type_name=文本`.

Only rows with `is_sender=1` and `type_name=文本` are retained. Incoming messages, quote replies (including quoted third-party text), forwards, media, locations and system records are excluded. Export metadata and filenames are not sent. Existing browser redaction runs on the retained text, before the existing reducer/server redaction. Raw exports are not copied into this repository.

| Local file | Total rows | Retained text messages | Skipped | Redacted characters |
| --- | ---: | ---: | ---: | ---: |
| Larger CSV | 203 | 87 | 116 | 1053 |
| Smaller CSV | 13 | 4 | 9 | 24 |

The smaller CSV alone is below the existing 40-character minimum. The file picker supports selecting multiple WeChat CSVs, concatenating only retained/redacted text, and showing counts plus the exact limited preview. Up to 20 files / 10 MB total; the existing 30,000-character payload cap remains visible. Any invalid file rejects the whole selection, clears old previews and blocks submission rather than falling back to raw writing. Paste detection directs WeChat CSV to the picker. Other encodings without a recognized UTF BOM must be re-exported as UTF-8.

## Checks

| Check | Result |
| --- | --- |
| Actual two exports | Pass: actual TypeScript decoder/parser executed locally against both files; counts above asserted. Only counts/character lengths printed, no message bodies or credentials. |
| Parser/privacy and UI callback tests | Pass: `npm.cmd run test:importers`, 10 tests. Covers sender filtering, quote/forward/media exclusion, metadata omission, escaped commas/quotes/newlines, malformed CSV, unknown flags, reordering, UTF decoding, redaction, WhatsApp regression and real Importer callback assembly with synthetic files. |
| Multi-file submission construction | Pass in UI callback test: synthetic exports combine only own text, redact email, send generic source instead of filenames, and a bad replacement clears the preceding valid payload. Reducer is mocked, so no data was sent. |
| Production build | Pass: `npm.cmd run build`. |
| Live browser UI | Pass: writing desk offers CSV/multiple selection and new copy. Pasting a CSV header displays a safe-file-selection error and disables submission. Synthetic own writing shows a redacted preview. No import submitted. |
| Native file chooser on physical desktop/phone and real export → model processing | Pending. The live personal exports were verified locally with the actual parser, not uploaded to the model during QA. |

Evidence: [writing desk](wechat-import-preview.png). No backend publish/schema changes or principles/0004 changes.
