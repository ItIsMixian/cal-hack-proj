# 0010 Graded fit from the conversation, shown as name cards, not recommendations

Status: Accepted (2026-10-24, both teammates). Not implemented. Amends the evidence part of 0004; the
conduct rules stay. To be implemented as part C of `docs/implementation/plans/mirror-fidelity.md`.

## Context

0004 lets a connection count only if the judge copies an exact phrase from each person's stored
information, and (except for the same intent today) only after two talks. On the local town with the
owner's real mirror ("mixian", 38 imported cards), all 8 of its diary entries came out "no fit", and the
server log shows why. The judge did propose connections; the rule rejected them all:

| Conversation | Judge's reason | Why it was rejected | Should it count? |
| --- | --- | --- | --- |
| mixian – Yun | mixian is building a ruined-greenhouse game level and working out its light; Yun thinks about how much of feeling a space is light and shadow | The phrases came from what they said, not from stored info | Yes. This is exactly what mirrors talking is for |
| Marco – Sam | Marco hates red/green charts (his dad is color blind); Sam loves giving quick, concrete feedback on figures | Phrase check or first talk | Yes |
| Tester – Yun | Both keep coming back to whether an AI can help strangers really get to know each other | Evidence not in stored info | Maybe |
| Marco – Tester | Same question about AI and strangers, Marco engaged with it | One side had no real evidence ("Not that out there, honestly") | No |
| Yun – Sam | AI understanding people vs. visualization feedback | Generic overlap | No |
| Priya – Alice | Priya needs a backend teammate; Alice is "organized and follows through" | Personality is not a skill | No |
| Yun – Bob | Yun wants to talk through an AI idea; Bob is "curious" | Personality is not a skill | No |
| Lena – Alice | Lena wants company at the workshop; Alice is "warm and easy to get along with" | Personality is not a skill | No |

So the rule blocks two different things at once. It correctly stops the model from passing off
personality adjectives as reasons, and it also throws away whatever the conversation discovered,
because a new detail ("a ruined-greenhouse level") is by definition not yet in the stored cards. The
core feature (mirrors meet first, the diary says who seemed a good fit) never completes.

## Choice

1. **Evidence may come from the conversation.** A reason counts if, for each person, the judge cites
   either an exact phrase from their stored information or a line their own mirror said in this
   conversation, together with the stored card or intent that line rests on. The server checks that the
   cited line exists in the transcript and was said by that person's mirror, and that the cited card or
   intent exists (exact phrase, as today).
2. **Personality never counts.** Adjectives about temperament (warm, curious, organized, calm, friendly
   and the like) are never a skill, a need being met, or a shared interest. The prompt says so with the
   rejected examples above; the reason must name a concrete thing (a project, a skill, a plan, a topic).
3. **Graded instead of yes/no.**
   - `good`: the same intent today, or a concrete overlap that came up again on a second talk. Counts as
     a good fit for 0008's daily limit and sorts first in the address book (point 6).
   - `maybe`: a concrete overlap on a first talk. The diary names it plainly ("we both think about how
     light makes a space feel") but does not mark a good fit; if they meet again and it holds, it becomes
     `good`.
   - `none`: everything else.
4. **Say what didn't click.** Every diary entry adds one honest, low-key line on what didn't connect or
   what is still unknown ("we never got past coffee", "I don't know if she wants a teammate"), so a
   missing recommendation has a reason too.
5. **The table above is the first eval set.** Re-run those eight cases through the new judgment after
   each prompt change; it must agree on at least seven (yes → `good` or `maybe`, maybe → `maybe` or
   `none`, no → `none`). Add new cases from the log as they come up.
6. **No "recommended" label; an address book of name cards instead.** The grade is never shown as a
   verdict. The address book in the Mirror Room (today it only holds the owner's own contact field)
   becomes a list of the people the mirror has gotten to know, one short name card each, in the spirit
   of the "closest friends" panel in *Chinese Parents*:
   - **Name, and one line on who they are and what they're up to**, written from what their mirror
     actually said in conversation (the per-pair memory note already stored in `relation`), never from
     the other person's cards. Strangers' `recent` and `warmth` cards stay hidden as before (0005).
   - **A shared-topic line** only when the grade is `maybe` or `good` ("you both think about how light
     makes a space feel"). `good` cards sort first; nothing else marks them.
   - **"Interested" on each card**, as in 0008; mutual interest still unlocks contact details.
   - Ordered by `good`, then `maybe`, then most recent talk. No counts, badges or notifications.
7. **Your own name card.** The same card about the owner, as other mirrors would describe them after
   a talk, shown at the top of the address book. It lets the owner check the second bar of the premise
   (never misrepresents you) directly, and fix the card behind anything wrong.

## Alternatives

- Keep 0004 and only loosen the phrase matching: still blind to what the conversation discovered.
- Drop code checks and trust the judge: the early runs in 0004 show it invents reasons.
- Mark every concrete overlap as a good fit on the first talk: more diary hits, but reasons feel cheap
  and the daily limit fills with first impressions.

## Consequences

- 0004's exact-phrase rule now applies only to stored information; lines from the conversation count
  when they are tied to a stored card or intent, and the server checks both.
- The diary never shows a "recommended" label; 0008's good-fit flag drives sorting in the address book
  and the daily limit only.
- The address book needs the per-pair memory note to describe the other person accurately; when the
  note is empty, the card shows only the name and where they met.
