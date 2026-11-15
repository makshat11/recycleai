import { z } from 'zod';
import { wasteAnalysisSchema, type AnalyzeResponse, type WasteAnalysis } from '../src/types/analysis';
import {
  SYSTEM_PROMPT,
  VISION_SYSTEM_PROMPT,
  buildRepairPrompt,
  buildUserPrompt,
  buildVisionUserPrompt,
  type VisionFinding,
} from './_prompt';
import {
  chatCompletion,
  ConfigError,
  ProviderError,
  hasAnyKey,
  resolveProviders,
  type ChatMessage,
  type ProviderConfig,
} from './_providers';

export const config = { maxDuration: 60 };

/* ------------------------------------------------------------------ limits */

const MAX_BODY_BYTES = 4_000_000; // Vercel request bodies cap at ~4.5 MB
const MAX_IMAGE_BYTES = 3_000_000; // decoded image bytes
const MAX_ITEM_NAME = 120;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const VISION_TIMEOUT_MS = 25_000;
const TEXT_TIMEOUT_MS = 35_000;
/** Successful analyses land around 2,000-2,500 tokens; providers reserve this
 *  whole figure against per-minute token quotas, so keep it tight. */
const ANALYSIS_MAX_TOKENS = 3_200;

/* ---------------------------------------------- best-effort rate limiting */

/**
 * In-memory fixed-window limiter. Serverless instances are ephemeral and not
 * shared, so this throttles bursts hitting a single warm instance only. It is
 * an abuse speed bump, not a guarantee -- see README "Quotas & abuse protection".
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 500) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return { allowed: true, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/* ----------------------------------------------------------------- helpers */

function json(body: AnalyzeResponse, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

type ErrorCode = Extract<AnalyzeResponse, { ok: false }>['error']['code'];

function fail(
  code: ErrorCode,
  message: string,
  status: number,
  retryable: boolean,
  extraHeaders: Record<string, string> = {},
) {
  return json({ ok: false, error: { code, message, retryable } }, status, extraHeaders);
}

/** Pulls the outermost JSON object out of a model reply that may be fenced or chatty. */
function extractJsonObject(raw: string): unknown {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) text = fence[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('no JSON object found in model reply');
  }
  return JSON.parse(text.slice(start, end + 1));
}

function describeIssues(error: unknown): string[] {
  if (error instanceof z.ZodError) {
    return error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  return error instanceof Error ? [error.message] : [];
}

/** Nudges near-miss model output into schema range instead of failing the whole request. */
function coerce(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;

  const clampList = (key: string, max: number) => {
    const list = obj[key];
    if (Array.isArray(list) && list.length > max) obj[key] = list.slice(0, max);
  };
  clampList('advantages', 5);
  clampList('disadvantages', 5);
  clampList('materials', 8);
  clampList('reuseIdeas', 3);
  clampList('possibleActions', 7);

  if (Array.isArray(obj.reuseIdeas)) {
    obj.reuseIdeas = obj.reuseIdeas.map((idea, index) => {
      if (!idea || typeof idea !== 'object') return idea;
      const i = idea as Record<string, unknown>;
      if (typeof i.id !== 'string' || !i.id.trim()) i.id = `idea-${index + 1}`;
      if (typeof i.difficulty === 'string') {
        const d = i.difficulty.toLowerCase();
        i.difficulty = d.startsWith('e') ? 'Easy' : d.startsWith('m') ? 'Medium' : 'Advanced';
      }
      if (Array.isArray(i.instructions)) i.instructions = i.instructions.slice(0, 12);
      if (Array.isArray(i.materialsNeeded)) i.materialsNeeded = i.materialsNeeded.slice(0, 12);
      return i;
    });
  }

  if (typeof obj.safetyLevel === 'string') {
    const s = obj.safetyLevel.toLowerCase();
    obj.safetyLevel = s.includes('hazard') ? 'hazardous' : s.includes('caut') ? 'caution' : 'standard';
  }
  for (const key of ['reuseIdeasNotice', 'uncertaintyNotice']) {
    const v = obj[key];
    if (typeof v === 'string' && (!v.trim() || v.trim().toLowerCase() === 'null')) obj[key] = null;
    if (v === undefined) obj[key] = null;
  }
  return obj;
}

/** Hard safety backstop: never ship DIY ideas for an item the model flagged hazardous. */
function enforceSafety(analysis: WasteAnalysis): WasteAnalysis {
  if (analysis.safetyLevel !== 'hazardous') return analysis;
  return {
    ...analysis,
    reuseIdeas: [],
    recommendedAction: { ...analysis.recommendedAction, type: 'specialized-disposal' },
    reuseIdeasNotice:
      analysis.reuseIdeasNotice ??
      'This item is treated as hazardous, so no do-it-yourself reuse projects are suggested. Please hand it to a qualified collection point or professional handler.',
  };
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: number } | null {
  const match = /^data:([a-z0-9.+/-]+);base64,([a-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const clean = match[2].replace(/\s/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return { mime, bytes: Math.floor((clean.length * 3) / 4) - padding };
}

function logProviderFailure(provider: ProviderConfig, stage: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[analyze] ${stage}: ${provider.id}/${provider.model} call failed: ${message.slice(0, 300)}`);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** One short retry for transient upstream failures (429, 5xx, timeouts). */
async function callWithRetry(
  provider: ProviderConfig,
  messages: ChatMessage[],
  options: Parameters<typeof chatCompletion>[2],
  stage: string,
): Promise<string> {
  try {
    return await chatCompletion(provider, messages, options);
  } catch (error) {
    if (error instanceof ProviderError && error.retryable) {
      logProviderFailure(provider, `${stage} (retrying once)`, error);
      await sleep(900);
      return chatCompletion(provider, messages, options);
    }
    throw error;
  }
}

function logShapeFailure(provider: ProviderConfig, stage: string, error: unknown) {
  const detail = describeIssues(error).join('; ').slice(0, 400) || 'unknown';
  console.warn(
    `[analyze] ${stage}: ${provider.id}/${provider.model} returned unusable JSON: ${detail}`,
  );
}

/* ------------------------------------------------------------ stage 1: see */

const visionFindingSchema = z.object({
  isPhysicalObject: z.boolean().default(true),
  objectName: z.string().trim().min(1).max(200),
  likelyMaterials: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
  visibleCondition: z.string().trim().max(400).default(''),
  otherObjects: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
  notes: z.array(z.string().trim().min(1).max(300)).max(6).default([]),
});

interface VisionOutcome {
  finding: VisionFinding;
  provider: ProviderConfig;
}

/**
 * Identifies the object in the photograph. Asks only "what is this?", which
 * returns in a few seconds; the heavy writing happens in stage 2 on a fast
 * text model.
 */
async function identifyFromImage(
  imageDataUrl: string,
  hint: string,
): Promise<VisionOutcome> {
  const providers = resolveProviders('vision');
  if (providers.length === 0) {
    throw new ConfigError(
      'Photo analysis is not configured on this server. Set NVIDIA_NIM_API_KEY, or a GROQ_VISION_MODEL if your Groq account has a vision model. You can still analyse items by typing the name.',
    );
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: VISION_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: buildVisionUserPrompt(hint || undefined) },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ],
    },
  ];

  let lastError: Error = new ProviderError('image analysis failed', 502, true);

  for (const provider of providers) {
    try {
      const raw = await callWithRetry(
        provider,
        messages,
        { timeoutMs: VISION_TIMEOUT_MS, maxTokens: 700, temperature: 0.2 },
        'vision',
      );
      const finding = visionFindingSchema.parse(extractJsonObject(raw));
      return { finding, provider };
    } catch (error) {
      lastError = error as Error;
      if (error instanceof ProviderError) logProviderFailure(provider, 'vision', error);
      else logShapeFailure(provider, 'vision', error);
    }
  }

  throw lastError;
}

/* ---------------------------------------------------------- stage 2: think */

interface AnalysisOutcome {
  analysis: WasteAnalysis;
  provider: ProviderConfig;
  attempts: number;
}

async function writeAnalysis(
  itemName: string,
  finding: VisionFinding | null,
): Promise<AnalysisOutcome> {
  const providers = resolveProviders('text');
  if (providers.length === 0) {
    throw new ConfigError(
      'AI analysis is not configured on this server. Set GROQ_API_KEY and/or NVIDIA_NIM_API_KEY.',
    );
  }

  const baseMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(itemName || undefined, finding) },
  ];

  let attempts = 0;
  let lastError: Error = new ProviderError('text analysis failed', 502, true);

  for (const provider of providers) {
    let messages = baseMessages;

    // One attempt, then one corrective round-trip naming the exact problems.
    for (let round = 0; round < 2; round += 1) {
      attempts += 1;
      let raw: string;
      try {
        raw = await callWithRetry(
          provider,
          messages,
          { timeoutMs: TEXT_TIMEOUT_MS, maxTokens: ANALYSIS_MAX_TOKENS },
          'analysis',
        );
      } catch (error) {
        lastError = error as Error;
        logProviderFailure(provider, 'analysis', error);
        break; // provider unreachable or refused -- move to the next one
      }

      try {
        const analysis = wasteAnalysisSchema.parse(coerce(extractJsonObject(raw)));
        return { analysis: enforceSafety(analysis), provider, attempts };
      } catch (error) {
        lastError = error as Error;
        logShapeFailure(provider, 'analysis', error);
        // Deliberately omit the previous (bad) reply: resending it doubles the
        // token count and trips Groq's tokens-per-minute limit on free tiers.
        messages = [
          ...baseMessages,
          { role: 'user', content: buildRepairPrompt(describeIssues(error)) },
        ];
      }
    }
  }

  throw lastError;
}

/* --------------------------------------------------------- error mapping */

function mapError(error: unknown): Response {
  // A missing/incomplete server configuration -- our own message is safe to show.
  if (error instanceof ConfigError) {
    return fail('not_configured', error.message, 503, false);
  }

  if (error instanceof ProviderError) {
    if (error.status === 429) {
      return fail(
        'rate_limited',
        'The AI provider is rate limiting requests right now. Please wait a moment and try again.',
        429,
        true,
      );
    }
    if (error.status === 504) {
      return fail('timeout', 'The AI provider took too long to respond. Please try again.', 504, true);
    }
    if (error.status === 401 || error.status === 403) {
      return fail(
        'not_configured',
        'The server could not authenticate with the AI provider. Check the API keys.',
        502,
        false,
      );
    }
    if (error.status === 503) {
      return fail(
        'upstream_error',
        'The AI provider is temporarily unavailable. Please try again in a moment.',
        503,
        true,
      );
    }
    return fail(
      'upstream_error',
      'The AI provider could not complete this analysis. Please try again.',
      502,
      true,
    );
  }

  return fail(
    'invalid_model_output',
    'The AI returned a response we could not safely interpret. Please try again, ideally with a clearer photo or a more specific item name.',
    502,
    true,
  );
}

/* ----------------------------------------------------------------- handler */

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
  }
  if (request.method !== 'POST') {
    return fail('method_not_allowed', 'Use POST to request an analysis.', 405, false, {
      Allow: 'POST, OPTIONS',
    });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return fail('bad_request', 'Send a JSON body with Content-Type: application/json.', 415, false);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) {
    return fail('payload_too_large', 'That request is too large. Please use a smaller image.', 413, false);
  }

  const limit = rateLimit(clientKey(request));
  if (!limit.allowed) {
    return fail(
      'rate_limited',
      `Too many analyses in a short time. Please wait about ${limit.retryAfter}s and try again.`,
      429,
      true,
      { 'Retry-After': String(limit.retryAfter) },
    );
  }

  let body: { itemName?: unknown; imageDataUrl?: unknown };
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return fail('payload_too_large', 'That request is too large. Please use a smaller image.', 413, false);
    }
    body = JSON.parse(text) as typeof body;
  } catch {
    return fail('bad_request', 'The request body was not valid JSON.', 400, false);
  }

  const itemNameRaw = typeof body.itemName === 'string' ? body.itemName.trim() : '';
  // eslint-disable-next-line no-control-regex
  const itemName = itemNameRaw.slice(0, MAX_ITEM_NAME).replace(/[\u0000-\u001F\u007F]/g, '');
  const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl : '';

  if (!itemName && !imageDataUrl) {
    return fail('bad_request', 'Enter an item name or upload a photo to analyse.', 400, false);
  }
  if (itemName && itemName.length < 2 && !imageDataUrl) {
    return fail('bad_request', 'Please enter at least two characters for the item name.', 400, false);
  }

  if (imageDataUrl) {
    const parsed = parseDataUrl(imageDataUrl);
    if (!parsed) {
      return fail(
        'unsupported_media',
        'The image could not be read. Please upload a JPEG, PNG or WebP file.',
        400,
        false,
      );
    }
    if (!ALLOWED_MIME.has(parsed.mime)) {
      return fail('unsupported_media', `Unsupported image type "${parsed.mime}". Use JPEG, PNG or WebP.`, 415, false);
    }
    if (parsed.bytes > MAX_IMAGE_BYTES) {
      return fail('payload_too_large', 'That image is too large. Please use one under 3 MB.', 413, false);
    }
  }

  if (!hasAnyKey()) {
    return fail(
      'not_configured',
      'AI analysis is not configured on the server. Set GROQ_API_KEY and/or NVIDIA_NIM_API_KEY.',
      503,
      false,
    );
  }

  const inputMode = imageDataUrl ? (itemName ? 'text+image' : 'image') : 'text';
  const startedAt = Date.now();

  try {
    let finding: VisionFinding | null = null;
    let visionProvider: ProviderConfig | null = null;

    if (imageDataUrl) {
      const outcome = await identifyFromImage(imageDataUrl, itemName);
      finding = outcome.finding;
      visionProvider = outcome.provider;

      if (!finding.isPhysicalObject) {
        return fail(
          'bad_request',
          'We could not find a clear object in that photo. Please try a closer, better-lit picture of a single item, or type the item name instead.',
          422,
          false,
        );
      }
    }

    const { analysis, provider, attempts } = await writeAnalysis(itemName, finding);

    return json(
      {
        ok: true,
        analysis,
        meta: {
          provider: provider.id,
          model: provider.model,
          visionProvider: visionProvider?.id,
          visionModel: visionProvider?.model,
          inputMode,
          elapsedMs: Date.now() - startedAt,
          attempts,
        },
      },
      200,
    );
  } catch (error) {
    console.error(
      `[analyze] failed after ${Date.now() - startedAt}ms (${inputMode}):`,
      error instanceof Error ? error.message : error,
    );
    return mapError(error);
  }
}
