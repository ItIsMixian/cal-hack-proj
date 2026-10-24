> 来源：cal-hack-proj/docs/core/principles.md，仓库 HEAD `8c6b381e08ee0b0b050b90d63a99113aac67053e`（2026-10-24）。下方保留仓库原文；“agreed”是源文档的状态，不代表本次合并新增用户确认。
>
> 版本提示：原文中的“不可见单向 wave → 私聊”已由 [ADR 0008](../decisions/0008-diary-and-mutual-interest.md) 部分取代为“可见兴趣 → 双方确认后解锁联系方式”；0008 尚未实现。合并后的来源边界见 [项目原则](discussion-context.md)。

# Principles

Status: agreed in discussion on 2026-10-24. Change only together, and record why in `docs/decisions/`.

## Goal

**Your mirrors meet first. Then you do.** Each person gets a *mirror*, a clearly fictional AI version
of themselves. Mirrors live in a shared 2D town, get to know each other, and only when there is a real
reason does anything reach the humans, and only if both want it.

## The demo loop (minimum that must work on stage)

1. A judge scans a QR code and makes a mirror in under a minute.
2. The mirror walks into town and goes about its day (place, activity, people around it).
3. It talks to other mirrors in a way that feels like real life.
4. A postcard arrives about someone worth meeting, with evidence from both people.
5. Both wave → a private human-to-human chat opens.

## Invariants

- **The endpoint is two people.** AI starts the conversation; humans have it. Mirrors never speak to
  real people on their owner's behalf.
- **No pressure.** Nothing pops up, nothing expires, nothing asks for an answer. The only response to
  a postcard is an optional wave, invisible until both wave. There is no "decline".
- **Mirrors never overreach.** They only say what their owner's information supports, never promise,
  never make plans, never offer intros they can't back up.
- **Connections need evidence.** A postcard requires an exact phrase from each person's own
  information, checked by the server. Generic overlap ("both like AI") never counts. At most two a day.
- **Privacy by construction.** Imports are parsed in the browser; only the owner's own lines leave
  the device, redacted. Nothing about third parties is kept. Raw text is never stored. Personal cards
  are hidden everywhere until the owner turns them on.
- **Sensible defaults, owner overrides.** Owners should not have to configure anything to get started;
  every default can be changed per card and per room.
- **Effortless input.** People hand over what already exists (chat exports, a short check), they do
  not describe themselves or pick tags.

## Constraints

- Cal Hacks 13.0: all project code written during the event; pre-existing code only as dependencies
  (organizer rule: "if deleting the pre-existing code deletes a majority of project, then it's not a
  dependency"). No AI Town code.
- First Devpost submission by Sunday 2026-10-25 09:00 PT; live demo at judging.
- Two people. Built with AI coding agents.

## Not doing (this weekend)

Agent task tracking, multi-world servers, a world generator, voice, native apps, real-time location.
