import type { Env } from './env';
import { num } from './env';
import { HttpError } from './http';

export interface ToolSchema {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}


export function costOf(env: Env, inputTokens: number, outputTokens: number): number {
  const pin = num(env.PRICE_IN_PER_MTOK, 2);
  const pout = num(env.PRICE_OUT_PER_MTOK, 10);
  return (inputTokens * pin + outputTokens * pout) / 1_000_000;
}

/**
 * Claude'u tek bir araç (tool) kullanmaya zorlayarak yapılandırılmış JSON çıktı alır.
 * Böylece cevap her zaman ekranda gösterilecek biçimde gelir.
 */
export async function callClaudeTool<T>(
  env: Env,
  opts: { system: string; messages: ClaudeMessage[]; tool: ToolSchema; maxTokens: number },
  fetcher: typeof fetch = fetch,
): Promise<ClaudeResult<T>> {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(500, 'config', 'Yapay zekâ anahtarı tanımlı değil.');
  const base = (env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');
  const res = await fetcher(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || 'claude-sonnet-5-5',
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: opts.messages,
      tools: [opts.tool],
      tool_choice: { type: 'tool', name: opts.tool.name },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Claude API hatası', res.status, body.slice(0, 500));
    if (res.status === 429 || res.status === 529) {
      throw new HttpError(503, 'ai_busy', 'Koç şu an çok yoğun. Birkaç dakika sonra tekrar dene.');
    }
    throw new HttpError(502, 'ai_error', 'Koç şu an cevap veremedi. Lütfen tekrar dene.');
  }

  const data = (await res.json()) as {
    content?: { type: string; name?: string; input?: unknown }[];
    usage?: { input_tokens?: number; output_tokens?: number };
    stop_reason?: string;
  };
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const block = data.content?.find((c) => c.type === 'tool_use' && c.name === opts.tool.name);
  if (!block || typeof block.input !== 'object' || block.input === null) {
    console.error('Claude araç çıktısı yok', data.stop_reason);
    throw Object.assign(new HttpError(502, 'ai_error', 'Koç şu an cevap veremedi. Lütfen tekrar dene.'), {
      usage: { inputTokens, outputTokens },
    });
  }
  return {
    data: block.input as T,
    inputTokens,
    outputTokens,
    costUsd: costOf(env, inputTokens, outputTokens),
  };
}
