import type { AnalyzeResponse, AnalyzeSuccess } from '@/types/analysis';

export class AnalyzeError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'AnalyzeError';
  }
}

export interface AnalyzeRequest {
  itemName?: string;
  imageDataUrl?: string;
  signal?: AbortSignal;
}

/**
 * Calls the server-side AI endpoint. No provider keys exist in the browser --
 * the request only ever goes to our own /api/analyze function.
 */
export async function requestAnalysis({
  itemName,
  imageDataUrl,
  signal,
}: AnalyzeRequest): Promise<AnalyzeSuccess> {
  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName: itemName?.trim() || undefined,
        imageDataUrl: imageDataUrl || undefined,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AnalyzeError('Analysis cancelled.', 'aborted', true);
    }
    throw new AnalyzeError(
      'We could not reach the analysis service. Check your connection and try again.',
      'network_error',
      true,
    );
  }

  let payload: AnalyzeResponse | null = null;
  try {
    payload = (await response.json()) as AnalyzeResponse;
  } catch {
    payload = null;
  }

  if (!payload) {
    throw new AnalyzeError(
      'The analysis service returned an unreadable response. Please try again.',
      'invalid_response',
      true,
    );
  }

  if (!payload.ok) {
    throw new AnalyzeError(payload.error.message, payload.error.code, payload.error.retryable);
  }

  return payload;
}
