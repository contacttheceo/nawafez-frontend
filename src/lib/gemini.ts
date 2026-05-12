/**
 * Gemini API helper with automatic model fallback.
 *
 * Uses gemini-2.5-flash for all tasks.
 * For simple JSON tasks, pass disableThinking:true to set thinkingBudget:0
 * which prevents the model from spending tokens on internal reasoning.
 */
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash',   // retry #2
  'gemini-2.5-pro',
];

/** @deprecated — use disableThinking option instead */
export const FAST_MODELS = MODELS;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiConfig {
  maxOutputTokens?: number;
  temperature?: number;
  disableThinking?: boolean; // set thinkingBudget:0 for simple JSON tasks
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

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const RETRY_DELAYS = [0, 2000, 0]; // ms before each attempt (index matches MODELS)

export async function callGemini(
  apiKey: string,
  parts: GeminiPart[],
  config: GeminiConfig = {},
  timeoutMs = 55_000,
  modelList: string[] = MODELS
): Promise<GeminiResult> {
  let lastResponse: Response | null = null;
  let lastModel = modelList[0];

  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    lastModel = model;

    if (i < RETRY_DELAYS.length && RETRY_DELAYS[i]) await sleep(RETRY_DELAYS[i]);

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
            ...(config.disableThinking && {
              thinkingConfig: { thinkingBudget: 0 },
            }),
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

/** Extract text from a successful Gemini response JSON.
 *  Thinking models (gemini-2.5-*) return multiple parts:
 *  parts[0] = internal thought (thought: true), parts[1] = actual reply.
 *  We skip thought parts and return the first real text part.
 */
export function extractText(json: unknown): string {
  const parts: any[] = (json as any)?.candidates?.[0]?.content?.parts ?? [];
  // Prefer non-thought parts (actual model output)
  for (const part of parts) {
    if (!part.thought && typeof part.text === 'string' && part.text.trim()) {
      return part.text;
    }
  }
  // Fallback: return first part text regardless
  return parts[0]?.text ?? '';
}

/** Strip markdown code fences and return parsed JSON, or null on failure */
export function parseJsonResponse(text: string): Record<string, unknown> | null {
  // 1. Strip ALL code fences anywhere in the string
  const stripped = text
    .replace(/```(?:json)?/gi, '')
    .trim();

  // 2. Try parsing stripped text directly
  try { return JSON.parse(stripped); } catch { /* continue */ }

  // 3. Try to extract the first complete JSON object {...}
  const objMatch = stripped.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* continue */ }
  }

  // 4. Try to extract the first complete JSON array [...]
  const arrMatch = stripped.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]) as any; } catch { /* continue */ }
  }

  // 5. Try raw text (no code fence)
  try { return JSON.parse(text.trim()); } catch { /* continue */ }

  // 6. Partial-JSON recovery: extract individual key:"value" pairs
  //    Handles truncated responses where the closing braces are cut off
  const partial: Record<string, unknown> = {};
  const keyValueRe = /"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = keyValueRe.exec(stripped)) !== null) {
    partial[m[1]] = m[2].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
  if (Object.keys(partial).length > 0) return partial;

  return null;
}
