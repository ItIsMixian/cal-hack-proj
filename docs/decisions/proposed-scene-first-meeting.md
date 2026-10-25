# A first meeting inside one continuous room

Status: Owner-authorized implementation (2026-10-24), unnumbered for teammate review. Amends the presentation and fallback described in `proposed-import-onboarding-and-voice.md` and `implementation/plans/import-first-onboarding.md`; no principle changes.

## Choice

First-time onboarding is an encounter in the authored room. The reflection stays in the room, its current prompt is a speech bubble anchored beside it, and responses and letters occupy the same scene. There is no separate illustration pane or bottom form panel. Only the current exchange is shown: name, bringing a letter, inspecting its redacted contents, then opening the door to town. Users can go back, edit a letter, change their look, or leave the lesson for later.

A first walk can start with a name alone. This replaces the forced three-word fallback in the original onboarding plan. No personal traits are assigned to that path: the stored self-card explicitly says no facts are known and simulation extraversion is neutral. The old three-word API path remains compatible.

The writing desk uses the same letter exchange. Fact checking presents one piece at a time, accepting or correcting it before turning the card. Voice rehearsal presents one generated line at a time, retaining the existing yes/no owner feedback and allowing replay or guidance. The optional personality check and today's topic become individual turns; the daily question is offered at the desk. Detailed sharing/card editing remains available on request.

These are scripted setup prompts, not a new free-form chat with one's mirror. Existing model import, privacy, owner authorization, redaction, and line-generation contracts remain in place. Character appearance work being developed concurrently is retained.

## Why

The owner explicitly rejected form-style onboarding and the subsequent split scene/panel version as disconnected. Interaction must feel like meeting and teaching the reflection in the place it inhabits. A single visual world and a single current action keep the relationship between the character and the user's response visible.

Validation: `../validation/interactive-first-meeting.md`.
