# Mirrorville design

**Your mirrors meet first. Then you do.**

Mirrorville gives each person a *mirror*: a clearly fictional AI version of themselves. Mirrors live
in shared 2D worlds, meet each other, and only when two of them find a real reason does anything
reach the humans, and only if both say yes.

## The pipeline

```
data sources ─► Mirror Room ─► facets ─► rooms / worlds ─► postcards ─► a real connection
```

### 1. Data sources: effortless, not self-description

People don't know which tags describe them, and filling in a profile is work. (At Cal Hacks the
official teammate matcher asked for self-assigned tags; that is exactly why some of us never used
it.) So the rule is: **you don't describe yourself, you hand over what already exists.**

Sources, all equal:

- Chat exports: WhatsApp (built-in "Export chat"), Messenger / Facebook ("Download your
  information", slow, so never on the demo path), Telegram, Discord.
- A conversational version of Aron's 36 questions: the mirror asks them like a friend would.
- Short personality check (TIPI) for a baseline.
- Professional traces: GitHub, Devpost, a portfolio.
- Long-term personal records, e.g. Marglo. Marglo is just one source; what is worth borrowing from it
  is its *long-term understanding of who you are* and the idea of a room where you watch how the
  AI understands you (below).

### 2. Mirror Room: the privacy filter you actually want to open

Everything imported passes through the Mirror Room before a mirror can use it. It is where you see
yourself as the AI sees you, and decide which side of you the mirror takes out of the house.

1. **Local first.** Parsing and obvious redaction (emails, phone numbers, links, handles) happen in
   the browser. For chat exports only *your own* lines are kept. Raw files never leave the device.
   An optional local model (Ollama) can do the next step on-device too.
2. **Conclusions, not quotes.** The model turns your lines into short cards ("jokes about
   themselves a lot with friends"), each tagged with its source. The text it read is not stored.
3. **Only about you.** Half of any chat is other people. Anything about them is dropped.
4. **Off by default.** New cards start unchecked. You choose which ones the mirror may use, and later
   which rooms may see them.
5. **"That's not me."** You can rewrite or delete any card. Your edit wins over anything inferred,
   and the previous text is kept so you can undo.

### 3. Facets: people are many-sided

You are funny with friends and precise with teammates (Goffman's front stage / back stage). Cards
carry a facet so a mirror can bring the right side into the right room:

- **core**: personality, values, how you think (from everything)
- **humor**, **warmth**: mostly from chats with friends and family
- **professional**: from chats with teammates and colleagues, GitHub
- **interests**, **recent**: what you're into and what you've been doing lately

Later: a **voice** layer (message length, emoji habits) so the mirror sounds like you.

### 4. Rooms and worlds: like servers, paced like Travel Frog

A world is a server you join with a purpose:

- **The venue** (Cal Hacks): public, everyone at the event.
- **Find teammates**: a room with a shared goal.
- **Old friends**: private, invite-only, for people you don't want to drift away from.
- Later: a world generator that lays out a town from what its members want to do.

Mirrors hang out where their **intent** points (gym, café, food court, workshop hall, hacker
lounge). Same intent, same place, more chances to meet.

The pace is Travel Frog, not a chat app: you leave, your mirror lives its life, and you come back to a
**postcard**: who it met, what came up, and the one thing worth picking up yourself.

### 5. Back to people

When two mirrors find a real overlap (a shared intent, a problem one of them already solved, a
topic both care about), each human gets a card with the reason and a concrete idea. Neither side
learns the other's answer unless both say yes. Then a private chat opens, written by the humans.

The ending can be small: dinner, a call, one message with a good reason to send it.

## Three stories for the pitch

| Story | Relationship | Use it for |
| --- | --- | --- |
| I didn't use the Cal Hacks teammate matcher: I didn't know my tags, and it felt like work | strangers with the same goal | opening; every judge is in that room |
| I want to hit the gym tomorrow; my mirror goes to the gym and meets someone who does too | same intent today | explaining how it works in one breath |
| Close friends from undergrad, slowly lost to "busy" and "later" | friends drifting apart | closing; why this matters beyond a hackathon |

> Today it's the people in this building you haven't met. Tomorrow it's the friends you're slowly
> losing. Your mirrors meet first. Then you do.

Demo: judges scan a QR code, make a mirror in under a minute, and watch it walk into town.

Draw the line with AI Town early: AI Town is watching AI live; Mirrorville ends with people meeting.

## Tracks

- **Meta**: strengthens real human connection; the endpoint is always two people.
- **Anthropic**: a named community (Cal Hacks participants). Claude does the judgments that can hurt
  people if wrong: what a card says about you, and whether two people should meet. The Mirror Room
  is the answer to "where could this go wrong for users".
- **SpacetimeDB**: the whole persistent world state and per-user privacy live in one module.
- **Figma** (design process), **CREAO** (only if a CREAO agent can be called from the backend: an
  async "team brief" after both people say yes).

## What exists now vs. next

Done: intent-zoned town, TIPI baseline card, per-person relation notes, encounter judging, mutual
opt-in, private human chat.

Next, in order: Mirror Room (import → cards → toggle/edit) · correction flow · triadic referral
("you should meet Marco") · rooms (teammates, old friends) · postcards.
