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

const UNREACHABLE =
  'Cannot reach the backend. Make sure it is running: uvicorn app.main:app --port 8000'

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

/** Sends the whole conversation (the last message is the new prompt) and returns {reply, model, elapsed_ms}. */
export const sendChat = (messages, { model = null, systemPrompt = null } = {}) =>
  request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
      model: model || undefined,
      system_prompt: systemPrompt || undefined,
    }),
  })
