/**
 * Model providers. "Works with any AI model" in practice means three shapes:
 *
 *  1. OpenAI-compatible /chat/completions — which is not just OpenAI. Groq,
 *     OpenRouter, DeepSeek, Together, vLLM, LM Studio and Ollama all speak it,
 *     so one adapter with a configurable baseUrl covers most of the field
 *     including fully local models.
 *  2. Anthropic's /v1/messages — a different envelope, so it needs its own.
 *  3. Google's generateContent — different again.
 *
 * Each adapter is deliberately thin: no SDK, just fetch. An SDK per provider
 * would be three dependencies and three upgrade treadmills to support what is
 * one POST and one field lookup.
 */
import type { ChatMessage, CompletionRequest, ModelProvider } from './types.js';

export class ProviderError extends Error {
  constructor(readonly provider: string, readonly status: number, message: string) {
    super(`${provider}: ${message}`);
    this.name = 'ProviderError';
  }
}

/**
 * Hosted APIs answer in seconds. A local model does not: a 12B model on CPU can
 * spend minutes on first token while the weights page in, and a timeout tuned
 * for an API turns "supports local models" into a claim that fails on first use.
 */
const DEFAULT_TIMEOUT_MS = 90_000;
const LOCAL_TIMEOUT_MS = 600_000;

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  provider: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<any> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      // Keep the provider's own message: "insufficient_quota" and "model not
      // found" need different fixes, and a generic "request failed" hides which.
      throw new ProviderError(provider, res.status, text.slice(0, 400));
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/** Loopback and LAN hosts are local runtimes, which need the longer budget. */
export function isLocalBaseUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.local');
  } catch {
    return false;
  }
}

/** Splits a system message out, for providers that take it as a separate field. */
function splitSystem(messages: ChatMessage[]): { system: string; rest: ChatMessage[] } {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  return { system, rest: messages.filter((m) => m.role !== 'system') };
}

// ---------------------------------------------------------------- OpenAI-compatible

export interface OpenAICompatibleOptions {
  apiKey: string;
  model: string;
  /** Override the request timeout. Local runtimes need far longer than an API. */
  timeoutMs?: number;
  /** Defaults to OpenAI. Point it at Groq, OpenRouter, Ollama, vLLM, anything. */
  baseUrl?: string;
  /** Label shown in provenance, e.g. "groq". Defaults to "openai-compatible". */
  label?: string;
}

export class OpenAICompatibleProvider implements ModelProvider {
  readonly name: string;
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(opts: OpenAICompatibleOptions) {
    this.name = opts.label ?? 'openai-compatible';
    this.model = opts.model;
    this.baseUrl = (opts.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
    this.apiKey = opts.apiKey;
    this.timeoutMs = opts.timeoutMs ?? (isLocalBaseUrl(this.baseUrl) ? LOCAL_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  }

  async complete(req: CompletionRequest): Promise<string> {
    const data = await postJson(
      `${this.baseUrl}/chat/completions`,
      { authorization: `Bearer ${this.apiKey}` },
      {
        model: this.model,
        messages: req.messages,
        max_tokens: req.maxTokens ?? 2000,
        temperature: req.temperature ?? 0.7,
        ...(req.json ? { response_format: { type: 'json_object' } } : {}),
      },
      this.name,
      this.timeoutMs,
    );
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new ProviderError(this.name, 200, 'no content in response');
    return content;
  }
}

// ---------------------------------------------------------------- Anthropic

export interface AnthropicOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class AnthropicProvider implements ModelProvider {
  readonly name = 'anthropic';
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(opts: AnthropicOptions) {
    this.model = opts.model;
    this.baseUrl = (opts.baseUrl ?? 'https://api.anthropic.com/v1').replace(/\/$/, '');
    this.apiKey = opts.apiKey;
  }

  async complete(req: CompletionRequest): Promise<string> {
    const { system, rest } = splitSystem(req.messages);
    const data = await postJson(
      `${this.baseUrl}/messages`,
      { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' },
      {
        model: this.model,
        max_tokens: req.maxTokens ?? 2000,
        temperature: req.temperature ?? 0.7,
        ...(system ? { system } : {}),
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      },
      this.name,
    );
    // content is a list of blocks; join the text ones.
    const text = (data?.content ?? [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => b.text)
      .join('');
    if (!text) throw new ProviderError(this.name, 200, 'no text block in response');
    return text;
  }
}

// ---------------------------------------------------------------- Google

export interface GoogleOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class GoogleProvider implements ModelProvider {
  readonly name = 'google';
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(opts: GoogleOptions) {
    this.model = opts.model;
    this.baseUrl = (opts.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
    this.apiKey = opts.apiKey;
  }

  async complete(req: CompletionRequest): Promise<string> {
    const { system, rest } = splitSystem(req.messages);
    const data = await postJson(
      `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {},
      {
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: rest.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 2000,
          temperature: req.temperature ?? 0.7,
          ...(req.json ? { responseMimeType: 'application/json' } : {}),
        },
      },
      this.name,
    );
    const text = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((p: any) => p?.text ?? '')
      .join('');
    if (!text) throw new ProviderError(this.name, 200, 'no text in response');
    return text;
  }
}

// ---------------------------------------------------------------- selection

export interface ProviderConfig {
  /** anthropic | openai | google | groq | openrouter | ollama | custom */
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  /** Override the request timeout, in ms. */
  timeoutMs?: number;
}

/** Base URLs for the OpenAI-compatible services worth naming explicitly. */
const OPENAI_COMPATIBLE_BASES: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  together: 'https://api.together.xyz/v1',
  deepseek: 'https://api.deepseek.com/v1',
  // Local runtimes. No key needed, hence the placeholder below.
  ollama: 'http://127.0.0.1:11434/v1',
  lmstudio: 'http://127.0.0.1:1234/v1',
};

/**
 * Builds a provider from config. Unknown providers fall through to the
 * OpenAI-compatible adapter with an explicit baseUrl, so a service that ships
 * after this code was written still works without a new adapter.
 */
export function createProvider(cfg: ProviderConfig): ModelProvider {
  const provider = cfg.provider.toLowerCase().trim();
  const isLocal = provider === 'ollama' || provider === 'lmstudio';

  if (!cfg.apiKey && !isLocal) {
    throw new Error(`Provider "${cfg.provider}" needs an apiKey`);
  }
  const apiKey = cfg.apiKey ?? 'local';

  if (provider === 'anthropic') return new AnthropicProvider({ apiKey, model: cfg.model, baseUrl: cfg.baseUrl });
  if (provider === 'google' || provider === 'gemini') {
    return new GoogleProvider({ apiKey, model: cfg.model, baseUrl: cfg.baseUrl });
  }

  const baseUrl = cfg.baseUrl ?? OPENAI_COMPATIBLE_BASES[provider];
  if (!baseUrl) {
    throw new Error(
      `Unknown provider "${cfg.provider}". Pass baseUrl to use it as an OpenAI-compatible endpoint.`,
    );
  }
  return new OpenAICompatibleProvider({ apiKey, model: cfg.model, baseUrl, label: provider, timeoutMs: cfg.timeoutMs });
}
