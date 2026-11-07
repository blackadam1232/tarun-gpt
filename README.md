# Tarun GPT

**Your AI. Your Ideas. Your Conversation.**

Tarun GPT is a ChatGPT-style chatbot powered by Google's Gemini API. A React interface talks to a small FastAPI backend, and the backend calls Gemini through the official `google-genai` SDK. No model is trained or hosted here: it is an API-based LLM application.

The Gemini API key lives only in the backend's `.env` file. The browser never sees it.

## Features

- Chat interface with a welcome screen, Markdown rendering, formatted code blocks, copy buttons and a clear-conversation action
- Enter to send, Shift + Enter for a new line, loading indicator, and response time shown under each answer
- Multiple conversations with automatic titles, new chat and delete; saved in the browser's local storage so they survive a reload
- Conversation context: the full history is sent with every prompt
- Readable errors for a missing or invalid key, unknown model, quota limits, timeouts, blocked prompts and an unreachable backend, with a Retry button
- Active model shown in the header; the model is chosen in `backend/.env`, so changing it needs no frontend change
- Dark theme with purple and blue accents; responsive desktop and mobile layouts

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, JavaScript, CSS3, Lucide React icons, react-markdown + remark-gfm |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| AI | Google Gemini API via `google-genai` |
| Config | `.env` file loaded with `python-dotenv` |

## Prerequisites

- **Python 3.10 or newer**
- **Node.js 20.19+ or 22.12+** (required by current Vite) with npm
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Project structure

```text
tarun-gpt/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app and endpoints
│   │   ├── gemini_service.py  # Gemini calls, history mapping, error translation
│   │   ├── schemas.py         # Pydantic request/response models
│   │   └── config.py          # Settings loaded from .env
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar, ChatWindow, Message, ChatInput, WelcomeScreen, Logo
│   │   ├── services/api.js    # All backend calls
│   │   ├── App.jsx            # State: conversations, loading, persistence
│   │   └── App.css, index.css
│   └── package.json
└── README.md
```

## Installation

### 1. Backend

```bash
cd backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 2. Environment configuration

Create `backend/.env` from the template (a placeholder `.env` is already included) and fill in your values:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
```

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes | Your Gemini API key |
| `GEMINI_MODEL` | yes | Gemini model ID to use. There is deliberately no default in the code |
| `CORS_ORIGINS` | no | Comma-separated allowed origins (default: `http://localhost:5173,http://127.0.0.1:5173`) |
| `REQUEST_TIMEOUT_SECONDS` | no | Gemini request timeout (default: `60`) |

Never commit `.env`; it is listed in `.gitignore`.

### 3. Frontend

```bash
cd frontend
npm install
```

## Running the app

Open two terminals.

**Backend** (from `backend/`, with the virtual environment active):

```bash
uvicorn app.main:app --reload --port 8000
```

**Frontend** (from `frontend/`):

```bash
npm run dev
```

Open <http://localhost:5173>. In development, Vite proxies `/api` requests to the backend on port 8000, so no CORS setup is needed.

For a production build run `npm run build`; the static files are written to `frontend/dist`. If you host them separately from the API, set `VITE_API_BASE_URL` (for example `https://api.example.com`) before building and add the site's origin to `CORS_ORIGINS`.

## Gemini API configuration

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey) and put it in `GEMINI_API_KEY`.
2. Pick a model ID from Google's [models page](https://ai.google.dev/gemini-api/docs/models) and put it in `GEMINI_MODEL`. Model IDs change over time and not every key can use every model. When this project was written, Google listed `gemini-3.6-flash` and `gemini-3.5-flash-lite` as generally available.
3. Restart the backend after editing `.env`.
4. Check the connection (see `/api/test` below).

The backend does not send `temperature`, `top_p` or `top_k`: Google has deprecated them for its newest model generations. Behaviour is steered with a system instruction in `gemini_service.py` instead.

## API reference

Interactive docs are available at <http://localhost:8000/docs> while the backend runs.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/api/health` | Backend status, active model, and whether the key and model are configured |
| GET | `/api/test` | Sends a tiny prompt to Gemini to verify the key and model |
| POST | `/api/chat` | Generates a reply from a conversation |

### `POST /api/chat`

Request: the whole conversation, ending with the new user message.

```json
{
  "messages": [
    { "role": "user", "content": "What is FastAPI?" },
    { "role": "assistant", "content": "FastAPI is a Python web framework..." },
    { "role": "user", "content": "Show me a minimal example." }
  ]
}
```

Validation: 1 to 100 messages, roles `user` or `assistant`, non-blank content up to 32,000 characters, and the last message must be from `user`.

Response:

```json
{ "reply": "Here is a minimal example...", "model": "gemini-3.6-flash", "elapsed_ms": 1840 }
```

Errors return `{ "detail": "<readable message>" }` with one of these statuses:

| Status | Meaning |
|---|---|
| 400 | Gemini rejected the request |
| 401 | API key invalid |
| 403 | Key lacks access to the model or region |
| 404 | `GEMINI_MODEL` not found for this key |
| 422 | Invalid request body, or Gemini blocked the prompt |
| 429 | Quota or rate limit reached |
| 502 | Gemini unavailable or returned an empty answer |
| 503 | Key or model not configured, or Gemini unreachable |
| 504 | Gemini timed out |

## Verifying your setup

With the backend running:

```bash
curl http://localhost:8000/api/health
# {"status":"ok","model":"gemini-3.6-flash","gemini_configured":true}

curl http://localhost:8000/api/test
# {"status":"ok","model":"gemini-3.6-flash","reply":"Tarun GPT is online.","elapsed_ms":...}
```

`gemini_configured: true` only means both values are set. `/api/test` is the call that proves the key is valid and the model is reachable.

To confirm the key stays private, open your browser's developer tools, go to the Network tab, and send a message. The only request is `POST /api/chat` to your own server, and no request or response contains the key.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Header shows **Backend offline** or "Cannot reach the Tarun GPT backend" | The backend is not running on port 8000. Start it with the `uvicorn` command above |
| **API key missing** / "GEMINI_API_KEY is not set" | Fill in `backend/.env`, then restart the backend |
| "Gemini rejected the API key" | The key is wrong or revoked. Create a new one in Google AI Studio |
| "Model '...' was not found" | `GEMINI_MODEL` is misspelled, retired, or unavailable to your key. Pick another ID from the models page |
| "Gemini quota or rate limit reached" | Wait a moment, or check your plan and limits in Google AI Studio. A lighter model may have higher limits |
| "Gemini denied access" | Check the key's permissions and that the Gemini API is available in your region |
| "Gemini blocked this prompt" | Gemini's safety filters declined it. Rephrase the prompt |
| Browser console shows a CORS error | You are not using the Vite dev server. Add your site's origin to `CORS_ORIGINS` and set `VITE_API_BASE_URL` |
| `ModuleNotFoundError` when starting the backend | The virtual environment is not active, or dependencies are not installed. Run `pip install -r requirements.txt` |
| `Address already in use` | Another process uses port 8000 or 5173. Stop it, or pass `--port` to `uvicorn` |
| Vite refuses to start on an old Node version | Upgrade to Node 20.19+ or 22.12+ |
| Conversations disappear | They are stored in this browser's local storage. Clearing site data or using a private window removes them |
#   t a r u n - g p t  
 