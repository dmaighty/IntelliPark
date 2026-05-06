from __future__ import annotations

import asyncio
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

load_dotenv()

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

SYSTEM_PROMPT = (
    "You are IntelliPark, a parking assistant. "
    "Only answer questions related to parking, garages, lots, street parking, "
    "parking rules, costs, availability, navigation to parking, and vehicle parking help. "
    "If a question is unrelated to parking, politely refuse and say you can only help with parking."
)

router = APIRouter(prefix="/parking-chat", tags=["parking-chat"])


class ParkingChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    text: str = Field(min_length=1, max_length=3000)


class ParkingChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)
    history: list[ParkingChatMessage] = Field(default_factory=list)


class ParkingChatResponse(BaseModel):
    reply: str


def _call_openai(message: str, history: list[ParkingChatMessage]) -> str:
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is missing. Add it to backend .env.",
        )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in history[-8:]:
        messages.append({"role": item.role, "content": item.text})
    messages.append({"role": "user", "content": message})

    payload = {
        "model": OPENAI_MODEL,
        "messages": messages,
        "temperature": 0.2,
    }

    req = Request(
        OPENAI_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urlopen(req, timeout=45.0) as resp:
            raw = resp.read().decode("utf-8")
    except HTTPError as e:
        details = e.read().decode(errors="replace") if e.fp else str(e.reason)
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI request failed ({e.code}): {details}",
        ) from e
    except URLError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to reach OpenAI: {e.reason}",
        ) from e

    try:
        parsed = json.loads(raw)
        return parsed["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise HTTPException(
            status_code=502,
            detail="Invalid response from OpenAI.",
        ) from e


@router.post("", response_model=ParkingChatResponse)
async def parking_chat(request: ParkingChatRequest):
    reply = await asyncio.to_thread(_call_openai, request.message, request.history)
    return ParkingChatResponse(reply=reply)