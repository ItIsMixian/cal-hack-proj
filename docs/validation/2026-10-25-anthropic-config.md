# Anthropic cloud configuration

Date: 2026-10-25. Application code: `190e33b`.

- PASS: updated local secret authenticated against Anthropic `GET /v1/models` (HTTP 200).
- PASS: synthetic Messages request using the exact headers and model options in `spacetimedb/src/llm.ts` returned HTTP 200, model `claude-opus-5-5`, `end_turn`, and the requested JSON result. Usage: 39 input and 9 output tokens. No user content was submitted.
- PASS: publisher-authorized `set_llm_config` on Maincloud database `mirrorville-yw9299-worlds` returned HTTP 200. In-memory readback confirmed the stored key matches; only the comparison boolean was printed. Existing DeepSeek key remains configured and Claude model remains `claude-opus-5-5`.
- Current routing: imports and post-conversation judgments use Claude when this key is present; dialogue remains DeepSeek. Evidence and consent checks remain server-enforced.
- Pending: end-to-end cloud import and completed conversation/diary acceptance after enabling the key. Direct provider success and configuration readback are not proof of those application paths.

No code/schema changes, database resets, resident mutations, or secret files committed.
