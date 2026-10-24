// Model calls made from procedures. SpacetimeDB procedures are synchronous and
// only expose ctx.http.fetch, so these use raw HTTP rather than provider SDKs.

type HttpCtx = {
  http: {
    fetch(
      url: string,
      init: { method: string; headers: Record<string, string>; body: string },
    ): { status: number; text(): string };
  };
};

export type LlmConfig = {
  deepseekKey: string;
  deepseekModel: string;
  anthropicKey: string;
  claudeModel: string;
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

// Cheap, high-volume chatter between mirrors goes to DeepSeek.
export function chatWithDeepSeek(
  ctx: HttpCtx,
  config: LlmConfig,
  system: string,
  messages: ChatMessage[],
  maxTokens: number,
): string {
  if (!config.deepseekKey) throw new Error('DeepSeek key not configured');
  const res = ctx.http.fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.deepseekKey}`,
    },
    body: JSON.stringify({
      model: config.deepseekModel || 'deepseek-chat',
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });
  const body = res.text();
  if (res.status !== 200) throw new Error(`DeepSeek ${res.status}: ${body.slice(0, 300)}`);
  const json = JSON.parse(body);
  return String(json.choices?.[0]?.message?.content ?? '').trim();
}

// Judgments that affect real people (who should meet, what a mirror knows
// about its owner) go to Claude when a key is configured.
export function askClaude(
  ctx: HttpCtx,
  config: LlmConfig,
  system: string,
  prompt: string,
  maxTokens: number,
): string {
  const res = ctx.http.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicKey,
      'anthropic-version': '2026-10-21',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: config.claudeModel || 'claude-opus-5-5',
      max_tokens: maxTokens,
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const body = res.text();
  if (res.status !== 200) throw new Error(`Claude ${res.status}: ${body.slice(0, 300)}`);
  const json = JSON.parse(body);
  if (json.stop_reason === 'refusal') throw new Error('Claude declined this request');
  return (json.content ?? [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('')
    .trim();
}

// Use Claude for judgment calls when available, DeepSeek otherwise.
export function judge(
  ctx: HttpCtx,
  config: LlmConfig,
  system: string,
  prompt: string,
  maxTokens: number,
): string {
  if (config.anthropicKey) return askClaude(ctx, config, system, prompt, maxTokens);
  return chatWithDeepSeek(ctx, config, system, [{ role: 'user', content: prompt }], maxTokens);
}

export function parseJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
