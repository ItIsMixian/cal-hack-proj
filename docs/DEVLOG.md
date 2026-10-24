# Devlog

Complete deliveries and important changes only.

## 2026-10-24

- Rewrote the project from scratch on SpacetimeDB (0001): town, mirrors, conversations, encounters,
  private chat, TIPI self-card.
- Mirror Room v1: WhatsApp/paste import with in-browser redaction, facet cards, rewrite/undo.
- Lifelike town and postcards (0003, 0004, 0005): daily rhythm, activities, extraversion, relationships,
  grounded conversations, evidence-checked postcards with waves; Mirror Room as a page with per-room defaults.
- Adopted the simplified Orrery documentation system (`docs/`, `.agents/skills/orrery-docs-local/`).

- Implemented 0008 on `yw/diary`: conversation diaries, visible interest, mutual contact unlock and
  Mirror Room contact editing; additive local migration preserved model keys. Legacy postcard/chat
  tables retained for migration safety, their API removed. Acceptance and Pending items are in
  `validation/0008-diary-and-mutual-interest.md`.
