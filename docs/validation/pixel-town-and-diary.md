# Pixel town and in-game journal

2026-10-24, `yw/diary`. Continues [room validation](pixel-room.md).

| Check | Result |
| --- | --- |
| Build | Pass: `npm.cmd run build`. |
| Existing behavior tests | Pass: `npm.cmd run test:diary`, all 10 tests, including ownership, interest/contact privacy and unchanged evidence rejection. |
| Live town | Pass: nine live mirrors displayed with the existing sprites on six distinct furnished venues; new dock replaces the sidebar. No simulation coordinates changed. |
| Desktop appearance | Pass: short desktop viewport shows the full map, action dock and caption; pixel font, cream/sage palette, signs, furniture, paths and sprite layering inspected. |
| Journal | Pass: dock opens native overlay over the running town. One entry per paper page; Older changed page 1 to 2 and the entry content, Newer restored page 1 and disabled at the newest boundary. |
| Room-to-journal route | Pass: resident list → own mirror → Open Mirror Room → Diary displays only that mirror's entries in the same book UI. |
| Closing and focus | Pass: Escape dismisses journal and returns focus to its opening button. Panels use native modal focus containment and visible focus outlines. |
| Mobile | Pass: actual app in same-origin iframe at 390 × 844 CSS pixels. Town dock, contact panel, room and paper journal checked; no horizontal page overflow observed. Native iframe avoids changing the user's browser size. |
| Guide and creation entry | Pass: opened guide and new-mirror form, then dismissed without creating data. |
| Visual scope | Pass: local fonts and character assets, contrasting captions, readable journal text, button wrapping, scene framing and responsive dock inspected. |
| Live new-entry insertion while reading an older page, last-page pagination boundary, journal empty state in redesigned book | Pending. |
| Persisted card/import/contact/interest mutations through this new UI, physical phone, screen reader, controller | Pending; handlers and backend reused, no test changes to owner data. |

Screenshots: [town desktop](pixel-ui/town-desktop.png), [town mobile](pixel-ui/town-mobile.png), [journal desktop](pixel-ui/town-diary.png), [journal mobile](pixel-ui/diary-mobile.png). The temporary viewport wrapper is removed after QA. No database publishing, key changes, principles changes or 0004 changes.
