/**
 * Thin adapter over the two OpenAI-compatible chat-completion providers used by
 * RecycleVision AI. Keys never leave the server.
 *
 *   groq   -> https://api.groq.com/openai/v1       (fast text analysis)
 *   nvidia -> https://integrate.api.nvidia.com/v1  (vision + text fallback)
 *
 * Text and vision are configured separately because a provider may serve one
 * and not the other. Groq's current catalogue, for example, rejects image
 * content parts outright, so photographs are identified on NVIDIA NIM and the
 * written analysis is produced by whichever text provider answers first.
 */

export type ProviderId = 'groq' | 'nvidia';
export type Capability = 'text' | 'vision';

export interface ProviderConfig {
  id: ProviderId;
  baseUrl: string;
  apiKey: string;
  /** The model to call for this request. */
  model: string;
  capability: Capability;
}

export interface ChatTextPart {
  type: 'text';
  text: string;
}
export interface ChatImagePart {
  type: 'image_url';
  image_url: { url: string };
}
export type ChatContent = string | Array<ChatTextPart | ChatImagePart>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: ChatContent;
}

/** The server is missing configuration. Never confuse this with an upstream 503. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

const DEFAULTS: Record<ProviderId, { baseUrl: string; textModel: string; visionModel: string }> = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    textModel: 'openai/gpt-oss-120b',
    // Groq's catalogue is text-only for this project; leave vision unset so
    // photographs are routed to a provider that accepts image parts. Set
    // GROQ_VISION_MODEL if a vision model becomes available on your account.
    visionModel: '',
  },
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    // minimax is excellent at reading photos but takes ~60s to write the full
    // analysis, which does not fit a serverless budget -- so the two stages use
    // different models here.
    textModel: 'nvidia/nemotron-3.5-bolt-e4b',
    visionModel: 'minimaxai/minimax-m3.1-flash',
  },
};

function readKey(id: ProviderId): string | undefined {
  if (id === 'groq') return process.env.GROQ_API_KEY?.trim();
  return process.env.NVIDIA_NIM_API_KEY?.trim() || process.env.NVIDIA_API_KEY?.trim();
}

function readBaseUrl(id: ProviderId): string {
  const raw =
    id === 'groq'
      ? process.env.GROQ_BASE_URL?.trim()
      : process.env.NVIDIA_NIM_BASE_URL?.trim();
  return (raw || DEFAULTS[id].baseUrl).replace(/\/+$/, '');
}

function readModel(id: ProviderId, capability: Capability): string {
  if (id === 'groq') {
    return capability === 'vision'
      ? (process.env.GROQ_VISION_MODEL ?? DEFAULTS.groq.visionModel).trim()
      : (process.env.GROQ_MODEL?.trim() || DEFAULTS.groq.textModel);
  }
  return capability === 'vision'
    ? (process.env.NVIDIA_NIM_VISION_MODEL?.trim() || DEFAULTS.nvidia.visionModel)
    : (process.env.NVIDIA_NIM_MODEL?.trim() || DEFAULTS.nvidia.textModel);
}

function order(): ProviderId[] {
  const configured = (process.env.AI_PROVIDER_ORDER ?? 'groq,nvidia')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is ProviderId => value === 'groq' || value === 'nvidia');
  return [...new Set(configured.length > 0 ? configured : (['groq', 'nvidia'] as ProviderId[]))];
}

/**
 * Providers that can serve the given capability, in preference order.
 * A provider with no key, or no model configured for that capability, is
 * skipped rather than called and failed.
 */
export function resolveProviders(capability: Capability): ProviderConfig[] {
  const configs: ProviderConfig[] = [];
  for (const id of order()) {
    const apiKey = readKey(id);
    if (!apiKey) continue;
    const model = readModel(id, capability);
    if (!model) continue;
    configs.push({ id, apiKey, baseUrl: readBaseUrl(id), model, capability });
  }
  return configs;
}

/** True when at least one provider has a key, regardless of capability. */
export function hasAnyKey(): boolean {
  return order().some((id) => Boolean(readKey(id)));
}

export interface ChatOptions {
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

/** Calls one provider's /chat/completions endpoint and returns the raw assistant text. */
export async function chatCompletion(
  provider: ProviderConfig,
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const { timeoutMs = 45_000, maxTokens = 4096, temperature = 0.4, jsonMode = true } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: 0.9,
        stream: false,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Read a bounded amount of the error body; never surface provider internals verbatim.
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      const retryable = response.status === 429 || response.status >= 500;
      throw new ProviderError(
        `${provider.id} responded ${response.status}${detail ? `: ${detail}` : ''}`,
        response.status,
        retryable,
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null; reasoning_content?: string | null } }>;
    };
    const message = payload.choices?.[0]?.message;

    // Some reasoning models leave `content` empty and put everything in
    // `reasoning_content`; the JSON we need is usually still in there.
    const text = message?.content?.trim() ? message.content : (message?.reasoning_content ?? '');
    if (!text || !text.trim()) {
      throw new ProviderError(`${provider.id} returned an empty completion`, 502, true);
    }
    return text;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProviderError(`${provider.id} request timed out`, 504, true);
    }
    throw new ProviderError(
      `${provider.id} request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      502,
      true,
    );
  } finally {
    clearTimeout(timer);
  }
}
