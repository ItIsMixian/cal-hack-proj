# Proposed: Cloud processing by default, an optional Ollama path, and the risk stated openly

Status: Proposed (2026-10-24).

## Context

Turning imports into cards sends the owner's own (redacted) words to a cloud model (DeepSeek, or Claude
per 0002). In-browser redaction only catches fixed formats (emails, numbers, links, handles), so names
of other people and some personal details can still reach the model. They are not stored and must not
appear in cards (0005), but they do pass through. A pre-upload line-by-line review would close the gap
but is too much work for users.

## Choice

- **Default: cloud processing, one click.** Unchanged import flow; works on phones.
- **Optional: process on my computer (Ollama).** An advanced option in the Mirror Room for people who
  run Ollama locally. The browser sends the text to the owner's own Ollama (`http://localhost:11434`)
  with the same card prompt, and only the resulting cards are sent to our server, redacted again. The
  owner must allow our origin in Ollama (`OLLAMA_ORIGINS`). Desktop only.
- **Say the risk plainly**, in three places:
  1. Next to the import button: your own words are sent to an AI model to be turned into cards; nothing
     you upload is stored; names or details of other people in your text may pass through the model,
     so leave them out; for local processing, use Ollama.
  2. The README and Devpost "risks and limits" section.
  3. The pitch, as part of "where it could go wrong for users" (Anthropic track).

## Alternatives

- Line-by-line preview before upload: safest, too much effort (conflicts with "effortless input").
- Exceptions-only warnings (flag suspected secrets or sensitive lines): kept for the backlog.
- In-browser models (Transformers.js name detection, WebLLM, Chrome built-in AI): no install, but model
  downloads, device limits, and unverified Chinese name detection; backlog.

## Consequences

- Cards must stay conclusion-only and free of third-party details regardless of which path produced them.
- The Ollama path needs its own small test (a local model with decent Chinese, e.g. a Qwen-family model).
