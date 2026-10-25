# Teammate Home scene integration

2026-10-24 · `yw/map-assets` · source `origin/yq` commit `1f404a9`.

## Change

Replaced the provisional SVG room with the five unchanged PNGs and authored Sprite2D
positions/scales/order from `mirrorvile/Home.tscn`. The bookshelf opens the existing import/notes
panel, the card desk opens cards, the mirror opens self/summary, and the diary opens the existing
private journal. A bedside cabinet hotspot retains the address book; the character remains clickable.
All furniture uses native buttons with accessible labels and focus indication.

## Validation

| Check | Result |
| --- | --- |
| Production build | Pass |
| Five PNG hashes/dimensions and all authored transforms/order match source | Pass (automated) |
| Desktop: original composition and all five furniture controls visible | Pass (browser) |
| Bookshelf → import panel with file selection, Read as, text/notes controls | Pass; opened only, no import submitted |
| Card desk → card collection | Pass |
| Mirror → self/summary panel | Pass |
| Diary → paginated private journal | Pass |
| Address book → private contact form | Pass; no contact changed |
| Closing each panel returns focus to its furniture button | Pass (browser accessibility state) |
| 390×844 portrait room, reachable controls and no visible horizontal overflow | Pass (browser; diary opened) |
| Complete regression suite including scene tests | Pass (55 tests) |
| Teammate device opens the shared preview | Pending |

No database publication, data reset or mixian (id 9) edits were performed. No raw source messages
or contact values are included in this record. Visual screenshots are kept outside the repository.
