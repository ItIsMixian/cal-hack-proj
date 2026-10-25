# Mirrorville

Current local multi-world test environment: run `npm.cmd run setup:worlds`, then
`npm.cmd run dev` (or `dev:worlds`). Open `http://127.0.0.1:5173/` and choose guest.
Backend: `127.0.0.1:3010`, database `mirrorville-worlds-test`. Original shared database
and `.env.local` are not modified. [Setup, behavior and limits](docs/design/local-world-test-environment.md).
The current module/client schema targets this test environment; the older run/deploy
instructions below are historical and are not a migration recipe for the shared database.

**Your mirrors meet first. Then you do.**

Mirrorville is a small shared town for the people at a hackathon. You make a *mirror*: a clearly
fictional AI version of yourself built from a short personality check and one sentence about what
you want to do today ("go to the gym tomorrow morning", "find someone to grab dinner with"). Your
mirror goes about its day in town: the Gym in the morning, the Food Court at lunch, the Workshop
Hall at night. It gets to know the people it keeps running into, the way you would.

Now and then it sends you a **postcard** about someone worth meeting, with the evidence from both of
you. Nothing pops up and nothing asks for an answer. If you feel like it, you wave; nobody sees a
wave unless **both** people wave, and only then does a private human-to-human chat open. The AI
starts the conversation. The humans have it.

Built during Cal Hacks 13.0. Project docs (principles, decisions, current state, validation) are in
[`docs/`](docs/README.md); agents start from [`AGENTS.md`](AGENTS.md).

## How it works

| Piece | Where |
| --- | --- |
| Town layout, places, activities, daily schedule | [`spacetimedb/src/world.ts`](spacetimedb/src/world.ts) |
| Personality check (TIPI) → self-card | [`spacetimedb/src/tipi.ts`](spacetimedb/src/tipi.ts) |
| Redaction, facets, rooms and their default visibility | [`spacetimedb/src/redact.ts`](spacetimedb/src/redact.ts) |
| World, relationships, conversations, postcards, Mirror Room | [`spacetimedb/src/index.ts`](spacetimedb/src/index.ts) |
| Model calls (DeepSeek for chatter, Claude for judgments) | [`spacetimedb/src/llm.ts`](spacetimedb/src/llm.ts) |
| Town renderer | [`src/WorldCanvas.tsx`](src/WorldCanvas.tsx) |
| Mirror Room, postcards, private chat | [`src/`](src) |

Everything server-side runs inside one **SpacetimeDB** module:

- A scheduled `tick` reducer moves mirrors every second. They follow the town's day (morning workout,
  lunch, the evening workshop), do something visible wherever they are, and notice each other.
  Strangers mostly just notice each other at first; outgoing mirrors start more conversations, and
  people who keep running into each other talk more and for longer.
- A scheduled `run_llm_job` procedure writes each line from the moment (time, place, what both are
  doing, what they remember about each other). Mirrors may not promise anything or make plans for
  their humans, and end a conversation when it has run its course.
- After each talk, the relationship (`relation`) is updated, and a postcard is written only if there
  is a real reason to meet: the same intent today, a need one person has that the other can meet, or
  a specific shared interest, backed by an exact phrase from **each** person's own information. The
  server checks the phrases; at most two postcards per person per day.
- Private tables hold owners, self-cards and Mirror Room cards; per-visitor views (`my_mirrors`,
  `my_postcards`, `my_cards`, `my_human_messages`) expose only what belongs to the connected identity.

## Run locally

Requirements: Node 20+, the [SpacetimeDB CLI](https://spacetimedb.com/install) (v2.13).

```bash
npm install
cd spacetimedb && npm install && cd ..
spacetime start                                   # in its own terminal
spacetime publish mirrorville --module-path spacetimedb --server local --yes
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
cp .env.example .env.local
npm run dev
```

Model keys live in a private table and can only be set by the identity that published the module:

```bash
npm run set-keys       # reads DEEPSEEK_API_KEY / ANTHROPIC_API_KEY from .env.local
```

Without an Anthropic key, judgments fall back to DeepSeek.

## Login and guest access

The entry screen reuses the team's Figma artwork as local source layers. Account login and signup use
SpacetimeAuth email magic links; “Explore as a guest” keeps a separate browser identity. Set the public
`VITE_SPACETIMEAUTH_CLIENT_ID` in `.env.local` before starting Vite. Existing guest mirrors stay available
through guest mode. See [auth setup](docs/design/login-and-auth.md) and [validation](docs/validation/login-figma-and-auth.md)
for the configured client, local callback allowlists, cloud ownership and remaining checks.

## Credits

- Character art: **Cup Nooble**, Sprout Lands, reused from the team's asset snapshot. Original
  [license terms](public/assets/characters/LICENSE.txt) and [source mapping](public/assets/characters/README.md)
  are included with the PNG.

- Project scaffold (module layout, `spacetime.json`, the agent guidance files `CLAUDE.md`, `AGENTS.md`,
  `.cursor/`) generated by `spacetime init` from SpacetimeDB.
- Ten-Item Personality Inventory: Gosling, S. D., Rentfrow, P. J., & Swann, W. B., Jr. (2003).
  *A very brief measure of the Big-Five personality domains.* Journal of Research in Personality, 37, 504-528.
- Idea inspired by *Generative Agents: Interactive Simulacra of Human Behavior* (Park et al., 2023)
  and a16z's AI Town. No code from either is used here.
- Written with help from AI coding assistants (Claude Code, Codex).
