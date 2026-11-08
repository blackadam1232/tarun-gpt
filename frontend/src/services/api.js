// Static frontend-only API client for Google's Gemini API.
// Calls https://generativelanguage.googleapis.com directly from the browser using native fetch.

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const SYSTEM_PROMPT =
  'You are Tarun GPT, a helpful, friendly and precise AI assistant. ' +
  'Answer clearly and concisely. Use Markdown for structure and put code in fenced ' +
  'code blocks with a language tag. If you are unsure, say so instead of guessing.'

/**
 * Maps chat history to Gemini's expected contents structure.
 * - Maps 'assistant' role to 'model'
 * - Filters out error messages
 * - Merges consecutive messages with the same role into one turn
 * - Ensures the last turn is from 'user'
 */
export function toGeminiContents(messages) {
  const valid = messages.filter(
    (m) => !m.error && (m.role === 'user' || m.role === 'assistant'),
  )
  const contents = []
  let lastRole = null

  for (const msg of valid) {
    const role = msg.role === 'assistant' ? 'model' : 'user'
    const text = (msg.content || '').trim()
    if (!text) continue

    if (role === lastRole && contents.length > 0) {
      // Merge consecutive turns with the same role
      contents[contents.length - 1].parts[0].text += `\n\n${text}`
    } else {
      contents.push({
        role,
        parts: [{ text }],
      })
      lastRole = role
    }
  }

  // Gemini expects the conversation to conclude with a user turn
  while (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
    contents.pop()
  }

  return contents
}

/**
 * Translates HTTP status codes and error payloads into human-readable messages.
 */
export function translateApiError(status, detail, model) {
  const lowered = (detail || '').toLowerCase()

  if (status === 429) {
    return 'Gemini quota or rate limit reached. Wait a moment and try again, or check your plan and limits in Google AI Studio.'
  }
  if (
    status === 401 ||
    (status === 400 &&
      (lowered.includes('api key not valid') ||
        lowered.includes('api_key_invalid') ||
        lowered.includes('api key expired')))
  ) {
    return 'Gemini rejected the API key. Check VITE_GEMINI_API_KEY in your .env file.'
  }
  if (status === 403) {
    return 'Gemini denied access. Check your API key permissions and region availability.'
  }
  if (status === 404) {
    return `Model '${model}' was not found. Check VITE_GEMINI_MODEL in your .env file.`
  }
  if (detail) {
    return `Gemini returned an error (HTTP ${status}): ${detail.slice(0, 300)}`
  }
  return `Gemini returned an error (HTTP ${status}).`
}

/**
 * Returns configuration status based on environment variables.
 * Kept so UI components continue receiving { status, model, gemini_configured } untouched.
 */
export async function getHealth() {
  const key = (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
  const model = (import.meta.env.VITE_GEMINI_MODEL || '').trim()
  return {
    status: 'ok',
    model: model || null,
    gemini_configured: Boolean(key && model),
  }
}

/**
 * Sends conversation to Gemini directly via fetch.
 * Returns { reply, model, elapsed_ms } matching the shape expected by the UI.
 */
export async function sendChat(messages, overrideModel = null) {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
  const configuredModel = (import.meta.env.VITE_GEMINI_MODEL || '').trim()
  const model = overrideModel || configuredModel

  // Validate configuration without hardcoding a default model
  if (!apiKey && !model) {
    throw new ApiError(
      'VITE_GEMINI_API_KEY and VITE_GEMINI_MODEL are missing. Please configure them in your .env file.',
      400,
    )
  }
  if (!apiKey) {
    throw new ApiError(
      'VITE_GEMINI_API_KEY is missing. Please set your Gemini API key in your .env file.',
      400,
    )
  }
  if (!model) {
    throw new ApiError(
      'VITE_GEMINI_MODEL is missing. Please set your Gemini model in your .env file.',
      400,
    )
  }

  const contents = toGeminiContents(messages)
  if (contents.length === 0) {
    throw new ApiError('No user message to send.', 400)
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
  }

  const started = performance.now()
  let response

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ApiError("Can't reach the Gemini API. Check your internet connection.", 0)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    /* Non-JSON response */
  }

  if (!response.ok) {
    const detail =
      data?.error?.message ||
      (typeof data?.detail === 'string' ? data.detail : '') ||
      response.statusText ||
      ''
    const message = translateApiError(response.status, detail, model)
    throw new ApiError(message, response.status)
  }

  const elapsed_ms = Math.round(performance.now() - started)

  // Check if prompt was blocked by safety filters
  const blockReason = data?.promptFeedback?.blockReason
  if (blockReason) {
    throw new ApiError(
      `Gemini blocked this prompt (${blockReason}). Try rephrasing your message.`,
      422,
    )
  }

  const candidate = data?.candidates?.[0]
  if (!candidate) {
    throw new ApiError('Gemini returned an empty response. Try again.', 502)
  }

  const parts = candidate.content?.parts || []
  const reply = parts
    .map((p) => p.text || '')
    .join('')
    .trim()

  if (!reply) {
    const finish = candidate.finishReason ? ` (${candidate.finishReason})` : ''
    throw new ApiError(`Gemini returned an empty response${finish}. Try again.`, 502)
  }

  return {
    reply,
    model,
    elapsed_ms,
  }
}
