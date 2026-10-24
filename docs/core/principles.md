# Principles

Status: agreed in discussion on 2026-10-24. Change only together, and record why in `docs/decisions/`.
**This branch proposes changes; see `docs/decisions/proposed-core-loop.md`.**

## Goal

**Your mirrors meet first. Then you do.** Each person gets a *mirror*, a clearly fictional AI version
of themselves. Mirrors live in a shared 2D town, get to know each other, and only when there is a real
reason does anything reach the humans, and only if both want it.

## The premise

**People have to feel that their mirror is them, living on in a world that continues their real one.**
Without that sense of ownership and identification, the diary is someone else's story, people read
it as spectators, and nobody reaches out to the people in it. Everything below depends on this, so it
is treated as an assumption to test, not a given.

Where it comes from:

- **Built from your own words**: the mirror is made from things you have actually written (chats, notes,
  what your AI assistant knows about you), because a questionnaire gives scores many people share and
  nobody recognizes themselves in. Data is the means, not the goal: only your own words, only what the
  mirror needs, conclusions kept and the raw text discarded (0005). Getting your words in must take
  under a minute on a phone; a mirror with nothing imported says honestly how little it knows.
- **Shaping it yourself**: small choices while making and correcting the mirror (the IKEA effect,
  Norton, Mochon & Ariely 2012), not a profile generated for you.
- **Recognizing yourself**: it says things you would say, about things you actually care about.
- **Continuity with real life**: what it does today comes from what you really mean to do today, and
  the diary answers back to that.
- **A little care**: a ten-second "before you head out" ritual (today's intent, one thing to bring
  up), like packing for the frog in Travel Frog.
- **Real stakes**: the people in the diary are real people.

The bar, in order (agreed 2026-10-24, after the owner's own mirror got the facts right but spoke in
a voice they would never use):

1. **True to what you actually do**: projects, interests, what you've been up to, today's intent. Every
   match and every topic rests on these; a wrong fact sends people toward someone who doesn't exist.
2. **Never misrepresents you**: no words you'd never say, no temper or traits you don't have. Like a
   friend who knows you well saying hello for you: they don't imitate you, but they never make you
   someone else.
3. **Sounds like you**: the goal, pursued (style card, lines you approve), but not the threshold for the
   product to work. Pitch it as "it represents you, and you shape it", not "it is you".

How we test it: owners pick their mirror's line out of three (their own, their mirror's, someone
else's mirror's); and whether they open the diary again and show interest in someone.

## The core feature

**Your mirror does the first encounter for you, writes it down in its diary, and you decide whether to
pick it up.** One loop, and the product does not work without any part of it:

1. **Meet**: the mirror lives in town by your intent and personality, runs into people, and talks.
2. **Diary**: you read who it met today, what came up, and who seemed like a good fit.
3. **Mutual interest**: you show interest; if they do too, real contact details unlock.

Supporting it, but not the core: the Mirror Room (how much the mirror is like you, and what it may
say) and the town's daily rhythm (so people with the same intent meet at the right time). Everything
else (more rooms, referrals, group chats, more sources, voice) is optional.

**Priority test:** does this make "mirror meets someone → they appear in the diary → both are
interested → contact unlocks" faster or more trustworthy? If yes, it comes first.

## The demo loop (minimum that must work on stage)

1. A judge scans a QR code and makes a mirror in under a minute.
2. Within a few minutes the mirror meets someone and a diary entry appears.
3. The judge shows interest; the other side (a demo mirror) is interested too; contact details unlock.

## Invariants

- **The endpoint is two people.** AI starts the conversation; humans have it. Mirrors never speak to
  real people on their owner's behalf.
- **No pressure.** Nothing pops up, nothing expires, nothing asks for an answer. Showing interest is
  optional, ignoring it sends nothing back, and there is no "decline".
- **Mirrors never overreach.** They only say what their owner's information supports, never promise,
  never make plans, never offer intros they can't back up.
- **Good fits need a reason.** A "good fit" needs one of the three reasons in 0004, grounded in what the
  two people actually shared. Generic overlap ("both like AI") never counts. (How strictly this is
  checked is under review.)
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
