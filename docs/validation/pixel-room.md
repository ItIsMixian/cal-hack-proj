# Pixel Mirror Room first version

2026-10-24, branch `yw/diary`.

| Check | Result |
| --- | --- |
| Build | Pass: `npm.cmd run build`. |
| Existing diary and contact rules | Pass: `npm.cmd run test:diary`, 10 tests. |
| Desktop room and mirror | Pass: live guest room; furniture, labels, sage rug, character, header and dialogue ribbon fit the short desktop viewport after resizing the scene with viewport height. Mirror opens the owner's self-card. |
| Cards and desk | Pass: card collection empty state leads to the writing desk; import controls and manual note editor are present. Fixed the Add button wrapping. |
| Diary | Pass: actual entries displayed, filtered to the current mirror ID, with interest controls and previously unlocked demo contact retained. No interest submitted during this check. |
| Contact | Pass: address book displays existing saved contact with mutual-only disclosure explanation. No contact changed. |
| Keyboard | Pass: close gets initial dialog focus; Escape closes and returns focus to the opening object. Native modal dialog contains focus. |
| Mobile layout | Pass: same-origin iframe provides a real 390 × 844 CSS viewport with the actual app and guest subscriptions. Larger object targets, wrapped labels and stacked contact form checked visually. Labels moved inside the room boundary. |
| Visual checks | Pass: local character/font loading, furniture label contrast, panel typography, readable input controls, short desktop fit, mobile label separation and visible focus outline. |
| File import, card mutation and contact save through redesigned panels | Pending: existing handlers reused, no new persisted data created during visual QA. |
| Physical phone, gamepad, screen reader | Pending. |

Evidence: [desktop](pixel-ui/room-desktop.png), [mobile](pixel-ui/room-mobile.png), [diary](pixel-ui/room-diary.png). Temporary mobile wrapper is removed after the related town QA.
