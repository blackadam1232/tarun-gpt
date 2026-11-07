"""Application settings, loaded once from backend/.env (or real environment variables)."""
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
_env_file = BACKEND_DIR / ".env"
if _env_file.exists():
    load_dotenv(_env_file)


def _clean(value: str | None) -> str:
    """Strip whitespace/quotes and treat the .env.example placeholders as 'not set'."""
    value = (value or "").strip().strip('"').strip("'")
    return "" if value.lower().startswith("your_") else value


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    gemini_model: str
    cors_origins: list[str]
    request_timeout_s: int


def load_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    # On Vercel, frontend and API share the same origin, so CORS is not needed.
    # But we still support explicit origins for other deployments.
    vercel_url = os.getenv("VERCEL_URL")
    if vercel_url and f"https://{vercel_url}" not in origins:
        origins = f"{origins},https://{vercel_url}"
    return Settings(
        gemini_api_key=_clean(os.getenv("GEMINI_API_KEY")),
        gemini_model=_clean(os.getenv("GEMINI_MODEL")),
        cors_origins=[o.strip() for o in origins.split(",") if o.strip()],
        request_timeout_s=int(os.getenv("REQUEST_TIMEOUT_SECONDS", "60")),
    )


settings = load_settings()
