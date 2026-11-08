"""Thin wrapper around the Google Gen AI SDK (google-genai).

The API key lives only here, on the server. Errors from Gemini are translated into
GeminiServiceError objects carrying an HTTP status and a message that is safe to show users.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass

from google import genai  # pyrefly: ignore[missing-import]
from google.genai import errors, types  # pyrefly: ignore[missing-import]

from .config import Settings
from .schemas import ChatMessage

logger = logging.getLogger("tarun_gpt.gemini")

SYSTEM_PROMPT = (
    "You are Ramagiri Tarun Siddhartha GPT, a helpful, friendly and precise AI assistant. "
    "Answer clearly and concisely. Use Markdown for structure and put code in fenced "
    "code blocks with a language tag. If you are unsure, say so instead of guessing."
)


class GeminiServiceError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


@dataclass
class Generation:
    text: str
    model: str
    elapsed_ms: int


def to_contents(messages: list[ChatMessage]) -> list[types.Content]:
    """Map chat history to Gemini contents ('assistant' -> 'model').

    Consecutive messages with the same role (e.g. after a failed request) are merged,
    because Gemini expects turns to alternate.
    """
    contents: list[types.Content] = []
    last_role = None
    for message in messages:
        role = "model" if message.role == "assistant" else "user"
        if role == last_role:
            previous = contents[-1].parts[0]
            previous.text = f"{previous.text}\n\n{message.content}"
        else:
            contents.append(types.Content(role=role, parts=[types.Part(text=message.content)]))
        last_role = role
    return contents


def translate_api_error(exc: errors.APIError, model: str) -> GeminiServiceError:
    code = getattr(exc, "code", None) or 500
    detail = (getattr(exc, "message", None) or str(exc)).strip()
    lowered = detail.lower()

    if code == 429:
        return GeminiServiceError(
            429,
            "Gemini quota or rate limit reached. Wait a moment and try again, or check "
            "your plan and limits in Google AI Studio.",
        )
    if "api key not valid" in lowered or "api_key_invalid" in lowered or code == 401:
        return GeminiServiceError(
            401, "Gemini rejected the API key. Check GEMINI_API_KEY in backend/.env."
        )
    if code == 403:
        return GeminiServiceError(
            403,
            "Gemini denied access. Check that the API key has permission to use this model "
            "and that the Gemini API is available in your region.",
        )
    if code == 404:
        return GeminiServiceError(
            404,
            f"Model '{model}' was not found or is not available to this API key. "
            "Update GEMINI_MODEL in backend/.env.",
        )
    if code == 400:
        return GeminiServiceError(400, f"Gemini rejected the request: {detail[:300]}")
    if code >= 500:
        return GeminiServiceError(
            502, f"Gemini is temporarily unavailable (HTTP {code}). Try again shortly."
        )
    return GeminiServiceError(502, f"Gemini returned an error (HTTP {code}): {detail[:300]}")


def extract_text(response: types.GenerateContentResponse) -> str:
    try:
        text = response.text
    except Exception:  # the SDK can raise when a response has no text parts
        text = None
    if text and text.strip():
        return text

    feedback = getattr(response, "prompt_feedback", None)
    block = getattr(feedback, "block_reason", None)
    if block:
        reason = getattr(block, "name", block)
        raise GeminiServiceError(422, f"Gemini blocked this prompt ({reason}). Try rephrasing it.")

    candidates = getattr(response, "candidates", None) or []
    finish = getattr(candidates[0], "finish_reason", None) if candidates else None
    suffix = f" (finish reason: {getattr(finish, 'name', finish)})" if finish else ""
    raise GeminiServiceError(502, f"Gemini returned an empty response{suffix}. Try again.")


_NETWORK_MODULES = {"httpx", "httpx2", "httpcore", "httpcore2", "requests", "aiohttp", "urllib3", "ssl", "socket"}


def classify_transport_error(exc: BaseException) -> str | None:
    """Return 'timeout' or 'network' if exc (or anything it wraps) is a transport failure.

    Checked by type name/module instead of importing the SDK's HTTP library, so this keeps
    working when google-genai switches HTTP clients between releases.
    """
    seen: set[int] = set()
    current: BaseException | None = exc
    kind = None
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        cls = type(current)
        if isinstance(current, TimeoutError) or "timeout" in cls.__name__.lower():
            return "timeout"
        if isinstance(current, OSError) or cls.__module__.split(".")[0] in _NETWORK_MODULES:
            kind = "network"
        current = current.__cause__ or current.__context__
    return kind


class GeminiService:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._client: genai.Client | None = None

    @property
    def model(self) -> str | None:
        return self._settings.gemini_model or None

    @property
    def configured(self) -> bool:
        return bool(self._settings.gemini_api_key and self._settings.gemini_model)

    def _get_client(self) -> genai.Client:
        if not self._settings.gemini_api_key:
            raise GeminiServiceError(
                503, "GEMINI_API_KEY is not set. Add it to backend/.env and restart the server."
            )
        if not self._settings.gemini_model:
            raise GeminiServiceError(
                503, "GEMINI_MODEL is not set. Add it to backend/.env and restart the server."
            )
        if self._client is None:
            self._client = genai.Client(
                api_key=self._settings.gemini_api_key,
                http_options=types.HttpOptions(timeout=self._settings.request_timeout_s * 1000),
            )
        return self._client

    async def generate(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        system_prompt: str | None = None,
    ) -> Generation:
        client = self._get_client()
        active_model = model or self._settings.gemini_model
        instruction = system_prompt or SYSTEM_PROMPT
        started = time.perf_counter()
        try:
            response = await client.aio.models.generate_content(
                model=active_model,
                contents=to_contents(messages),
                config=types.GenerateContentConfig(system_instruction=instruction),
            )
        except errors.APIError as exc:
            logger.warning("Gemini API error %s: %s", getattr(exc, "code", "?"), exc)
            raise translate_api_error(exc, active_model) from exc
        except Exception as exc:
            kind = classify_transport_error(exc)
            if kind == "timeout":
                raise GeminiServiceError(
                    504, "Gemini took too long to respond. Try again or shorten the conversation."
                ) from exc
            if kind == "network":
                logger.warning("Network error talking to Gemini: %r", exc)
                raise GeminiServiceError(
                    503,
                    "Could not reach the Gemini API. Check your internet connection and any "
                    "proxy or firewall settings.",
                ) from exc
            logger.exception("Unexpected error while calling Gemini")
            raise GeminiServiceError(500, "Unexpected error while contacting Gemini.") from exc

        text = extract_text(response)
        elapsed_ms = round((time.perf_counter() - started) * 1000)
        return Generation(text=text, model=active_model, elapsed_ms=elapsed_ms)

    async def self_test(self) -> Generation:
        prompt = [ChatMessage(role="user", content="Reply with exactly: Ramagiri Tarun Siddhartha GPT is online.")]
        return await self.generate(prompt)
