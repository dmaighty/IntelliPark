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
    "If a question is unrelated to parking, politely refuse and say you can only help with parking. "
    "When the user message includes their approximate city or area (or GPS coordinates as fallback), "
    "use it for local parking context and suggestions; do not claim exact street addresses or live "
    "availability unless the user provides them."
)

router = APIRouter(prefix="/parking-chat", tags=["parking-chat"])


class ParkingChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    text: str = Field(min_length=1, max_length=3000)


class UserLocation(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: float | None = Field(
        default=None,
        ge=0,
        description="Horizontal accuracy in meters, if available",
    )


class UserPlace(BaseModel):
    """Human-readable area from reverse geocoding (preferred over raw coordinates)."""

    city: str | None = None
    region: str | None = Field(
        default=None,
        description="State, province, or similar administrative area",
    )
    country: str | None = None


class ChatImageAttachment(BaseModel):
    mime_type: str = Field(default="image/jpeg")
    data: str = Field(min_length=1, description="Base64-encoded image bytes")


class ParkingChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)
    history: list[ParkingChatMessage] = Field(default_factory=list)
    user_place: UserPlace | None = None
    user_location: UserLocation | None = Field(
        default=None,
        description="Optional fallback when city/area cannot be resolved",
    )
    images: list[ChatImageAttachment] = Field(default_factory=list)


class ParkingChatResponse(BaseModel):
    reply: str


def _place_label(place: UserPlace | None) -> str | None:
    if place is None:
        return None
    parts: list[str] = []
    for raw in (place.city, place.region, place.country):
        if raw is None:
            continue
        s = str(raw).strip()
        if s:
            parts.append(s)
    if not parts:
        return None
    return ", ".join(parts)


def _format_user_message_with_context(
    message: str,
    user_place: UserPlace | None,
    user_location: UserLocation | None,
) -> str:
    label = _place_label(user_place)
    if label:
        return (
            "[User approximate area: "
            f"{label}. "
            "Use this for nearby parking and local context; you do not have live lot occupancy data "
            "unless the user provides it.]\n\n"
            f"{message}"
        )
    if user_location is None:
        return message
    acc = ""
    if user_location.accuracy is not None:
        acc = f", horizontal accuracy ~{user_location.accuracy:.0f} m"
    return (
        "[User approximate current location (WGS84; geocoding to city was unavailable): "
        f"latitude {user_location.latitude:.6f}, "
        f"longitude {user_location.longitude:.6f}{acc}. "
        "Use this when the user asks about nearby parking or what's close.]\n\n"
        f"{message}"
    )


def _build_user_message_content(
    message: str,
    user_place: UserPlace | None,
    user_location: UserLocation | None,
    images: list[ChatImageAttachment] | None = None,
) -> str | list[dict]:
    text = _format_user_message_with_context(
        message, user_place, user_location
    )

    if not images:
        return text

    content: list[dict] = [{"type": "text", "text": text}]

    for image in images:
        mime_type = (image.mime_type or "image/jpeg").strip() or "image/jpeg"
        content.append(
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{image.data}",
                },
            }
        )

    return content


def _call_openai(
    message: str,
    history: list[ParkingChatMessage],
    user_place: UserPlace | None = None,
    user_location: UserLocation | None = None,
    images: list[ChatImageAttachment] | None = None,
) -> str:
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is missing. Add it to backend .env.",
        )

    user_content = _build_user_message_content(
        message, user_place, user_location, images
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in history[-8:]:
        messages.append({"role": item.role, "content": item.text})
    messages.append({"role": "user", "content": user_content})

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
    reply = await asyncio.to_thread(
        _call_openai,
        request.message,
        request.history,
        request.user_place,
        request.user_location,
        request.images,
    )
    return ParkingChatResponse(reply=reply)