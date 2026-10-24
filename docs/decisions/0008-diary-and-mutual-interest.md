# 0008 Each mirror keeps a diary; mutual interest unlocks real contact details

Status: Accepted (2026-10-24). Implemented; see [validation](../validation/0008-diary-and-mutual-interest.md) for checked and Pending scenarios. Supersedes part of 0003 (see below).

## Context

0003 replaced popups with postcards that only appear when there is a match, an invisible wave, and an
in-app chat. The intended experience is closer to reading a diary: you check in on what your mirror
did, and you decide who seems interesting.

## Choice

- **Diary.** Every mirror keeps a diary written in first person to its owner: one entry per
  conversation, grouped by day. Each entry says where it was, what it was doing, who it talked to, what
  came up, and whether that person seemed like a good fit (mirrors still never promise anything or make
  plans; 0004 conduct rules stay).
- **Interest.** On any diary entry about someone, the owner can tap a button to say they're interested.
  **The other person can see that interest** in their own mirror's diary entry about them.
- **Mutual.** If the other person is interested too, both are confirmed and **real contact details
  unlock** for each other. Contact details are entered privately in the Mirror Room (e.g. Instagram,
  WeChat, email) and are shown only after both have confirmed.
- **No pressure, unchanged from 0003:** no popups, no toasts, no expiry, no decline button. Ignoring
  someone's interest is fine and sends nothing back.

## What it replaces in 0003

- Postcards that exist only for matches → diary entries for every conversation (a matched person is
  simply marked as a good fit inside the diary).
- Invisible one-sided waves → visible interest.
- In-app human chat after both wave → exchanging real contact details.

## Why

Reading what your mirror did is the Travel Frog experience the product is built around; matches feel
earned when you can see the whole day. Showing interest is a familiar, low-key signal (Hinge's
"likes you"), and the endpoint is a real-world connection rather than another chat inside the app.

## Open

- How 0004's evidence rule should work for "good fit" marks (0004 is under review, see backlog).
- Whether a person can withdraw interest once shown.
