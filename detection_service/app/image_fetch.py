"""Fetch a single image frame from an HTTP(S) URL (e.g. IP camera snapshot)."""

from __future__ import annotations

from urllib.parse import urlparse

import httpx

MAX_IMAGE_BYTES = 25 * 1024 * 1024


def _allowed_url(url: str) -> bool:
    parsed = urlparse(url.strip())
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


async def fetch_image_from_url(url: str, *, timeout: float = 20.0) -> bytes:
    if not _allowed_url(url):
        raise ValueError("Only http:// or https:// URLs with a host are allowed.")

    headers = {"User-Agent": "SmartPark-DetectionService/1.0"}

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(timeout),
    ) as client:
        response = await client.get(url.strip(), headers=headers)
        response.raise_for_status()
        data = response.content
        if len(data) > MAX_IMAGE_BYTES:
            raise ValueError(f"Image exceeds maximum size ({MAX_IMAGE_BYTES // (1024 * 1024)} MB).")
        if not data:
            raise ValueError("Empty response from URL.")
        return data
