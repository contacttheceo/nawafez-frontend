/**
 * Gemini API helper with automatic model fallback.
 *
 * Tries models in order: gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash
 * Fallback triggers only on overload / high-demand errors (503 or matching message).
 */

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiConfig {
  maxOutputTokens?: number;
  temperature?: number;
}

interface GeminiResult {
  response: Response;
  model: string;
}

function isOverloadError(status: number, message: string): boolean {
  if (status === 503 || status === 429) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('high demand') ||
    lower.includes('overload') ||
    lower.includes('capacity') ||
    lower.includes('try again') ||
    lower.includes('unavailable')
  );
}

export async function callGemini(
  apiKey: string,
  parts: GeminiPart[],
  config: GeminiConfig = {},
  timeoutMs = 55_000
): Promise<GeminiResult> {
  let lastResponse: Response | null = null;
  let lastModel = MODELS[0];

  for (const model of MODELS) {
    lastModel = model;

    let response: Response;
    try {
      response = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'X-goog-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            maxOutputTokens: config.maxOutputTokens ?? 8192,
            temperature: config.temperature ?? 0.3,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: unknown) {
      // Network/timeout error — try next model
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('abort')) {
        lastResponse = null;
        continue;
      }
      throw err;
    }

    if (response.ok) {
      return { response, model };
    }

    // Clone to read body without consuming the stream
    lastResponse = response;
    const errData = await response.clone().json().catch(() => ({}));
    const errMsg: string = (errData as any)?.error?.message ?? '';

    if (isOverloadError(response.status, errMsg)) {
      // Try next model
      continue;
    }

    // Non-overload error → return immediately (caller handles it)
    return { response, model };
  }

  // All models failed — return last response or throw
  if (lastResponse) return { response: lastResponse, model: lastModel };
  throw new Error('All Gemini models are currently unavailable. Please try again later.');
}

/** Extract text from a successful Gemini response JSON */
export function extractText(json: unknown): string {
  return (json as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/** Strip markdown code fences and return parsed JSON, or null on failure */
export function parseJsonResponse(text: string): Record<string, unknown> | null {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    /* try to extract first {...} block */
  }

  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      /* fall through */
    }
  }

  return null;
}
