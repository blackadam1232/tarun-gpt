# Tarun GPT — Static Frontend AI Chatbot

**Your AI. Your Ideas. Your Conversation.**

[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_API-8E75B2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Static_Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

A high-performance, ChatGPT-style conversational assistant built as a **static-only (frontend-only)** React application that communicates with Google's Gemini API directly from the browser using native `fetch`.

There is **no backend, no server, and no Python**.

---

## Features

- **Modern ChatGPT Obsidian Interface**: Dark theme with sidebar, conversation history, and macOS-style code blocks.
- **Direct Gemini Client**: Direct browser-to-API calls via `https://generativelanguage.googleapis.com`.
- **Alternating Turn History**: Full conversation history mapping that merges consecutive turns with the same role and excludes errors.
- **Speech Recognition**: Voice dictation directly in the input box using the Web Speech API.
- **Model Switching**: Switch models seamlessly via the header dropdown or `.env` configuration.
- **Local Persistence**: All chat conversations are securely saved to browser `localStorage`.
- **Zero Server Overhead**: Hostable on any static CDN (Vercel, GitHub Pages, Netlify, Cloudflare Pages).

---

## Security Notes

> [!WARNING]
> **Important API Key Considerations for Static Frontends**
> 
> - In a client-side static application, any `VITE_` environment variable is compiled into the client JavaScript bundle and is visible to anyone inspecting the page network requests or source.
> - **Local Development**: Use your Gemini API key in `frontend/.env` for local personal use. Never commit `.env` to version control.
> - **Public Hosting**: If hosting publicly, restrict your Gemini API key by HTTP referrer (domain restriction) and configure strict spending quotas in the [Google Cloud Console](https://console.cloud.google.com/). Alternatively, use a personal key input model where each user provides their own key.

---

## Configuration

Create a `.env` file inside the `frontend/` directory (or use `.env.example` as a template):

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-3.6-flash
```

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | **Yes** | Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey). |
| `VITE_GEMINI_MODEL` | **Yes** | The Gemini model identifier (e.g. `gemini-3.6-flash`, `gemini-2.5-flash`). There is deliberately no hardcoded default in code. |

---

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Gemini API key:

```bash
cp .env.example .env
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Production Build

To build the static application for production:

```bash
cd frontend
npm run build
```

Static production files are emitted to `frontend/dist/`. These files can be deployed directly to any static web host or CDN.

---

## Testing

The API communication layer is tested with mocked `fetch` requests covering:
- Request URL, endpoint formatting, and `x-goog-api-key` header verification.
- Conversation context mapping (`assistant` -> `model`) and consecutive turn merging.
- All HTTP error cases (400, 401, 403, 404, 429, 500, network failures, safety blocks, and empty responses).

Run the automated API test suite:

```bash
node test-api.mjs
```

---

## License

MIT
