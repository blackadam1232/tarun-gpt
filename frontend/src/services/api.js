// All communication with the FastAPI backend lives here, separate from the UI.
// In development Vite proxies /api to the backend; set VITE_API_BASE_URL to override.
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status // 0 means the backend could not be reached
  }
}

const UNREACHABLE = BASE
  ? `Cannot reach the backend at ${BASE}. The server might be waking up or blocking requests.`
  : 'Cannot reach the backend. Make sure it is running: uvicorn app.main:app --port 8000'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError(UNREACHABLE, 0)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    /* body was not JSON */
  }

  if (!response.ok) {
    if (typeof data?.detail === 'string') throw new ApiError(data.detail, response.status)
    // The dev proxy answers with an empty 5xx when nothing is listening on the backend port.
    if (response.status >= 500) throw new ApiError(UNREACHABLE, 0)
    throw new ApiError(`Request failed (HTTP ${response.status}).`, response.status)
  }
  return data
}

export const getHealth = () => request('/api/health')

/** Sends prompt to optimize into a detailed, structured prompt */
export const enhancePrompt = (prompt) =>
  request('/api/enhance-prompt', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  }).then((res) => res.enhanced)

/** Streams Gemini responses live via Server-Sent Events (SSE). */
export async function streamChat(
  messages,
  { model = null, systemPrompt = null, signal = null, onChunk, onDone } = {},
) {
  let response
  try {
    response = await fetch(`${BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
        model: model || undefined,
        system_prompt: systemPrompt || undefined,
      }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') return ''
    throw new ApiError(UNREACHABLE, 0)
  }

  if (!response.ok) {
    let errData = null
    try {
      errData = await response.json()
    } catch {
      /* ignore */
    }
    throw new ApiError(errData?.detail || `HTTP ${response.status}`, response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim()
          if (!jsonStr) continue
          try {
            const data = JSON.parse(jsonStr)
            if (data.error) {
              throw new ApiError(data.error, 500)
            }
            if (data.text) {
              fullText += data.text
              onChunk?.(fullText)
            }
            if (data.done) {
              onDone?.(data)
            }
          } catch (e) {
            if (e instanceof ApiError) throw e
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return fullText
    throw err
  }

  return fullText
}

/** Non-streaming fallback */
export const sendChat = (messages, { model = null, systemPrompt = null } = {}) =>
  request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
      model: model || undefined,
      system_prompt: systemPrompt || undefined,
    }),
  })
