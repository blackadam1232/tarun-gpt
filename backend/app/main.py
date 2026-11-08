"""FastAPI entry point: health check, Gemini connectivity test and chat endpoint."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .gemini_service import GeminiService, GeminiServiceError
from .schemas import ChatRequest, ChatResponse, HealthResponse, TestResponse

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Ramagiri Tarun Siddhartha GPT API", version="1.0.0")
handler = app
gemini = GeminiService(settings)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(GeminiServiceError)
async def gemini_error_handler(_: Request, exc: GeminiServiceError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0]
    where = ".".join(str(part) for part in first["loc"] if part != "body")
    message = str(first["msg"]).removeprefix("Value error, ")
    prefix = f"Invalid request ({where})" if where else "Invalid request"
    return JSONResponse(status_code=422, content={"detail": f"{prefix}: {message}"})


@app.get("/")
async def root() -> dict:
    return {"message": "Welcome to the Ramagiri Tarun Siddhartha GPT API", "docs": "/docs"}


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok", model=gemini.model, gemini_configured=gemini.configured
    )


@app.get("/api/test", response_model=TestResponse)
async def test_gemini() -> TestResponse:
    """Sends a tiny prompt to Gemini to prove the key and model both work."""
    result = await gemini.self_test()
    return TestResponse(
        status="ok", model=result.model, reply=result.text.strip(), elapsed_ms=result.elapsed_ms
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    result = await gemini.generate(
        request.messages,
        model=request.model,
        system_prompt=request.system_prompt,
    )
    return ChatResponse(reply=result.text, model=result.model, elapsed_ms=result.elapsed_ms)
