# NeuralGPT — Full-Stack AI Chatbot

**Your AI. Your Ideas. Your Conversation.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_API-8E75B2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

A modern, high-performance, ChatGPT-style conversational assistant powered by Google's Gemini API. Built with a responsive React interface and a lightweight FastAPI backend utilizing the official `google-genai` SDK.

The Gemini API key remains secured on the server side—it is never exposed to the client browser.

---

## Features

- **Modern Obsidian Interface**: Cosmic dark mode with layered glassmorphism, glowing micro-borders, and ambient lighting effects.
- **Rich Markdown & Code Rendering**: Formatted code blocks with macOS-style window controls, syntax detection, and one-click copy buttons.
- **Multi-Turn Conversation Memory**: Full conversation context is preserved across turns and synchronized with local storage.
- **Instant Chat Search**: Filter conversation history quickly from the sidebar.
- **Real-Time Performance Metrics**: Inference response time displayed per message alongside helpful feedback actions.
- **Zero-Friction Model Switching**: Choose any Gemini model ID via environment variables without touching frontend code.
- **Resilient Error Handling**: Clear human-readable error messages for quota limits, invalid keys, or timeouts, complete with an inline **Retry** button.
- **Full-Stack Deployment Ready**: Configured for local development or instant serverless deployment on Vercel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, JavaScript, CSS3 (Glassmorphism), Lucide Icons, `react-markdown`, `remark-gfm` |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, Uvicorn |
| **AI Engine** | Google Gemini API via official `google-genai` SDK |
| **Configuration** | Environment variables with `python-dotenv` |
| **Deployment** | Vercel (Serverless Python Function + Static Vite Bundle) |

---

## Project Structure

```text
├── api/
│   └── index.py               # Vercel serverless entry point
├── backend/
│   ├── app/
│   │   ├── config.py          # App settings loaded from .env
│   │   ├── gemini_service.py  # Gemini SDK integration and error mapping
│   │   ├── main.py            # FastAPI endpoints and route handlers
│   │   └── schemas.py         # Pydantic request/response validation
│   ├── .env.example           # Environment template
│   └── requirements.txt       # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar, ChatWindow, Message, ChatInput, WelcomeScreen, Logo
│   │   ├── services/api.js    # API communication client
│   │   ├── App.jsx            # State management and conversation persistence
│   │   └── App.css, index.css # Obsidian design system and theme styles
│   ├── index.html
│   └── package.json
├── vercel.json                # Vercel serverless build and routing configuration
├── requirements.txt           # Root requirements for Vercel Python builder
└── README.md
```

---

## Getting Started (Local Development)

### Prerequisites

- **Python 3.10+**
- **Node.js 20+** with npm
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/apikey)

---

### 1. Backend Setup

Open a terminal and set up the Python environment:

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `backend/.env` file with your credentials:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
```

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload --port 8000
```

- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

---

### 2. Frontend Setup

Open a second terminal:

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

In development mode, Vite automatically proxies all `/api` requests to `http://localhost:8000`.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | — | Your Google Gemini API key |
| `GEMINI_MODEL` | **Yes** | `gemini-3.6-flash` | The Gemini model identifier (e.g. `gemini-3.6-flash`, `gemini-2.5-flash`) |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed CORS origins |
| `REQUEST_TIMEOUT_SECONDS` | No | `60` | Maximum request timeout for Gemini API calls |

---

## Deployment to Vercel

The repository includes pre-configured [`vercel.json`](vercel.json) and serverless handlers for one-click deployment.

### Option A: Via GitHub

1. Initialize Git and push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new) and **Import** the repository.
3. In the project settings, add the environment variables:
   - `GEMINI_API_KEY` = `your_gemini_api_key`
   - `GEMINI_MODEL` = `gemini-3.6-flash`
4. Click **Deploy**.

### Option B: Via Vercel CLI

```bash
# Run deployment wizard
npx vercel

# Add environment variables
npx vercel env add GEMINI_API_KEY
npx vercel env add GEMINI_MODEL

# Deploy to production
npx vercel --prod
```

---

## API Reference

Interactive Swagger documentation is accessible at `/docs` while the server runs.

### `POST /api/chat`

Generates an assistant response for the conversation history.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Explain microservices architecture." },
    { "role": "assistant", "content": "Microservices architecture is an approach where..." },
    { "role": "user", "content": "What are the trade-offs?" }
  ]
}
```

**Response Body:**
```json
{
  "reply": "The primary trade-offs of microservices include...",
  "model": "gemini-3.6-flash",
  "elapsed_ms": 1140
}
```

### `GET /api/health`

Returns server status and verification flags.

```json
{
  "status": "ok",
  "model": "gemini-3.6-flash",
  "gemini_configured": true
}
```

### `GET /api/test`

Executes a lightweight handshake prompt with Gemini to verify credentials and model connectivity.

---

## Troubleshooting

| Issue | Cause & Resolution |
|---|---|
| **Backend Offline** in header | Ensure the FastAPI server is running on port `8000`. |
| **API Key Missing** | Set `GEMINI_API_KEY` in `backend/.env` (or Vercel dashboard) and restart the server. |
| **Unexpected model name format** | Ensure `GEMINI_MODEL` contains a valid Google model ID (e.g. `gemini-3.6-flash`), not a custom nickname. |
| **Quota or Rate Limit Reached** | Google Gemini rate limit hit. Wait a few moments or switch to a lighter model in `.env`. |
| **CORS Error** | In local dev, always use Vite's dev server (`http://localhost:5173`) which proxies `/api` calls. For remote deployments, configure `CORS_ORIGINS`. |

---

## License

This project is licensed under the [MIT License](LICENSE).
