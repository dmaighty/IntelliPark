from __future__ import annotations

import asyncio
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.routes.lots import find_nearby_lots
from app.services.public_parking import (
    PublicParkingUnavailable,
    search_public_parking,
)

load_dotenv()

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

MAX_TOOL_ITERATIONS = 4

SYSTEM_PROMPT = (
    "You are IntelliPark, a parking assistant. "
    "Only answer questions related to parking, garages, lots, street parking, "
    "parking rules, costs, availability, navigation to parking, and vehicle parking help. "
    "If a question is unrelated to parking, politely refuse and say you can only help with parking. "
    "You have two tools for finding real nearby parking: `search_internal_lots` (IntelliPark's own "
    "garages/lots, including live open-spot counts — always try this first) and "
    "`search_public_parking` (OpenStreetMap public/on-street parking and municipal lots, for locations "
    "IntelliPark hasn't onboarded). Only call these tools with coordinates taken verbatim from a "
    "'User's coordinates' line in the message context — NEVER invent, guess, or reuse example "
    "coordinates from your own training (e.g. do not default to San Francisco, New York, or any other "
    "'example city'). If the user asks to find nearby parking and no coordinates are present in the "
    "context, do not call either tool — instead ask the user to share their location or tell you their "
    "city/area. Only state addresses, distances, prices, or availability that come directly from a tool "
    "result — never invent or guess them. If a tool returns an empty list, say plainly that no parking "
    "was found nearby. If a tool result contains an 'error' field instead, that means the search itself "
    "failed (e.g. a timeout) — tell the user the search is temporarily unavailable and suggest trying "
    "again, and do NOT say there is no parking nearby, since you don't actually know that. "
    "When listing results, use each result's 'name' (and 'address' if present) to identify it — never "
    "print raw latitude/longitude numbers to the user; those fields are for internal map-linking only."
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_internal_lots",
            "description": (
                "Search IntelliPark's own database of garages and lots near a location. Returns "
                "real data including address, hourly rate, rating, and current open-spot counts. "
                "Prefer this over search_public_parking since it has live occupancy data."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "radius_km": {
                        "type": "number",
                        "description": "Search radius in kilometers. Defaults to 5.",
                    },
                    "lot_type": {
                        "type": "string",
                        "enum": ["garage", "open_lot"],
                        "description": "Optional filter; omit to search both types.",
                    },
                },
                "required": ["latitude", "longitude"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_public_parking",
            "description": (
                "Search OpenStreetMap for public parking (on-street spots and municipal lots) near "
                "a location that may not be in IntelliPark's own database. Use this when "
                "search_internal_lots has no nearby results, or the user specifically asks about "
                "public, free, or street parking."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "radius_km": {
                        "type": "number",
                        "description": "Search radius in kilometers. Defaults to 1.5.",
                    },
                },
                "required": ["latitude", "longitude"],
            },
        },
    },
]

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
    """Human-readable area from reverse geocoding (shown alongside coordinates, not instead of them)."""

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
        description="User's coordinates; required for nearby-parking searches",
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
    context_parts: list[str] = []

    label = _place_label(user_place)
    if label:
        context_parts.append(f"User's approximate area: {label}.")

    if user_location is not None:
        acc = (
            f", horizontal accuracy ~{user_location.accuracy:.0f} m"
            if user_location.accuracy is not None
            else ""
        )
        context_parts.append(
            "User's coordinates (WGS84) for nearby-parking tool calls: "
            f"latitude {user_location.latitude:.6f}, longitude {user_location.longitude:.6f}{acc}."
        )

    if not context_parts:
        return (
            "[No location provided by the user. Do not call search_internal_lots or "
            "search_public_parking, and do not guess coordinates — if the user asks about nearby "
            "parking, ask them to share their location or tell you their city/area.]\n\n"
            f"{message}"
        )

    context = " ".join(context_parts)
    return f"[{context}]\n\n{message}"


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


def _post_chat_completion(payload: dict) -> dict:
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
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail="Invalid response from OpenAI.",
        ) from e


def _run_tool_call(db: Session, name: str, arguments: dict) -> object:
    latitude = arguments.get("latitude")
    longitude = arguments.get("longitude")
    if latitude is None or longitude is None:
        return {"error": "latitude and longitude are required"}

    if name == "search_internal_lots":
        results = find_nearby_lots(
            db,
            lat=latitude,
            lon=longitude,
            radius_km=arguments.get("radius_km") or 5.0,
            lot_type=arguments.get("lot_type"),
        )
        return [r.model_dump() for r in results]

    if name == "search_public_parking":
        try:
            return search_public_parking(
                lat=latitude,
                lon=longitude,
                radius_km=arguments.get("radius_km") or 1.5,
            )
        except PublicParkingUnavailable:
            return {
                "error": "search_temporarily_unavailable",
                "message": (
                    "The public parking search service is temporarily unavailable "
                    "(not that there is no parking nearby). Tell the user this "
                    "specific search failed and suggest trying again shortly."
                ),
            }

    return {"error": f"Unknown tool: {name}"}


def _call_openai(
    db: Session,
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

    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in history[-8:]:
        messages.append({"role": item.role, "content": item.text})
    messages.append({"role": "user", "content": user_content})

    # Only expose the nearby-parking tools when we have real coordinates to search
    # from — otherwise the model has no way to call them without inventing numbers.
    tools = TOOLS if user_location is not None else None

    for _ in range(MAX_TOOL_ITERATIONS):
        payload = {
            "model": OPENAI_MODEL,
            "messages": messages,
            "temperature": 0.2,
        }
        if tools:
            payload["tools"] = tools
        parsed = _post_chat_completion(payload)

        try:
            choice_message = parsed["choices"][0]["message"]
        except (KeyError, IndexError) as e:
            raise HTTPException(
                status_code=502,
                detail="Invalid response from OpenAI.",
            ) from e

        tool_calls = choice_message.get("tool_calls")
        if not tool_calls:
            return (choice_message.get("content") or "").strip()

        messages.append(choice_message)
        for call in tool_calls:
            fn = call.get("function", {})
            try:
                arguments = json.loads(fn.get("arguments") or "{}")
            except json.JSONDecodeError:
                arguments = {}

            result = _run_tool_call(db, fn.get("name", ""), arguments)
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call.get("id"),
                    "content": json.dumps(result),
                }
            )

    raise HTTPException(
        status_code=502,
        detail="Parking search took too many steps to complete. Please try again.",
    )


@router.post("", response_model=ParkingChatResponse)
async def parking_chat(request: ParkingChatRequest, db: Session = Depends(get_db)):
    reply = await asyncio.to_thread(
        _call_openai,
        db,
        request.message,
        request.history,
        request.user_place,
        request.user_location,
        request.images,
    )
    return ParkingChatResponse(reply=reply)
