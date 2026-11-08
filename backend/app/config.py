"""Application settings, loaded once from backend/.env (or real environment variables)."""
from __future__ import annotations

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
    origins = os.getenv("CORS_ORIGINS", "*")
    timeout_raw = os.getenv("REQUEST_TIMEOUT_SECONDS", "60")
    try:
        timeout_s = int(timeout_raw) if timeout_raw else 60
    except ValueError:
        timeout_s = 60

    return Settings(
        gemini_api_key=_clean(os.getenv("GEMINI_API_KEY")),
        gemini_model=_clean(os.getenv("GEMINI_MODEL", "gemini-3.6-flash")),
        cors_origins=[o.strip() for o in origins.split(",") if o.strip()],
        request_timeout_s=timeout_s,
    )


settings = load_settings()
