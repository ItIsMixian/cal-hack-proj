# Diary source evidence

User-approved urgent scope, 2026-10-25: permit Mirror questions, reactions and tentative opinions without inventing the owner's life. Keep Mirror opinions distinct from human claims. No schema change or relationship-flow expansion.

The conversation prompt forbids new owner experiences, actions, skills, habits, preferences and plans. Wrap-up preserves attribution in both memory and diary prose. These are generation constraints, not a guarantee that every sentence is true.

Wrap-up selects an ID from the other participant's allowed shared cards, stated intent or current-day topic. The server attaches the exact offered excerpt only when its ID, kind and text still match the currently permitted source at commit. Private, missing, changed, withdrawn or wrong-person selections produce no source label. The model never supplies the displayed quotation.

The existing diary text field carries a versioned `[mirrorville-source-v1]` JSON suffix. The client separates this from summaries and renders a small source block; intent and topic have distinct labels. No checkmark implies independent verification. The excerpt supports itself, not every opinion in the conversation. Relevance selection still depends on the model.

Legacy entries receive no invented evidence or backfill. Saved excerpts are historical snapshots; this change does not implement retrospective redaction when a source is later withdrawn.

Integration: preserve the target branch's world/room visibility rules when adapting `diarySourcesFor`; the source checkout uses `ACTIVE_ROOM`. Do not replace the target backend file wholesale.
