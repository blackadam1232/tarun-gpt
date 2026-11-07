"""Pydantic models that validate every request and response."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=32_000)

    @field_validator("content")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("message content must not be blank")
        return value


class ChatRequest(BaseModel):
    """The full conversation so far; the last message is the new user prompt."""

    messages: list[ChatMessage] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def last_message_is_user(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("the last message must come from the user")
        return self


class ChatResponse(BaseModel):
    reply: str
    model: str
    elapsed_ms: int


class HealthResponse(BaseModel):
    status: str
    model: str | None
    gemini_configured: bool


class TestResponse(BaseModel):
    status: str
    model: str
    reply: str
    elapsed_ms: int
