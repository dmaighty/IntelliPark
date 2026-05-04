"""Proxy inference to the detection service (YOLO). Image source is hardcoded for now."""

from __future__ import annotations

import asyncio
import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException

# TODO: replace with frame extraction from video / per-lot camera_feed_url from DB.
HARDCODED_FRAME_URL = "http://170.249.152.2:8080/cgi-bin/viewer/video.jpg"

DETECTION_SERVICE_URL = os.environ.get(
    "DETECTION_SERVICE_URL",
    "http://127.0.0.1:8001",
).rstrip("/")

router = APIRouter(prefix="/prediction", tags=["prediction"])


def _post_predict_blocking(predict_url: str, params: dict) -> tuple[int, object]:
    """Synchronous POST with query string only (stdlib — same Python as uvicorn)."""
    qs = urlencode(params)
    full_url = f"{predict_url}?{qs}"
    req = Request(
        full_url,
        data=b"",
        method="POST",
        headers={"User-Agent": "IntelliPark-API/1.0"},
    )
    try:
        with urlopen(req, timeout=60.0) as resp:
            status = resp.getcode()
            raw = resp.read().decode()
    except HTTPError as e:
        status = e.code
        raw = e.read().decode(errors="replace") if e.fp else str(e.reason)
    except URLError as e:
        raise ConnectionError(str(e.reason)) from e

    try:
        return status, json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        return status, raw


@router.get("/live-frame")
async def predict_live_frame(
    conf: float = 0.25,
    imgsz: int = 640,
):
    """
    Fetch one snapshot from the hardcoded camera URL and run detection via the
    detection service. Configure base URL with ``DETECTION_SERVICE_URL``.
    """
    predict_url = f"{DETECTION_SERVICE_URL}/api/predict"
    params = {"url": HARDCODED_FRAME_URL, "conf": conf, "imgsz": imgsz}

    try:
        status, body = await asyncio.to_thread(
            _post_predict_blocking, predict_url, params
        )
    except ConnectionError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Detection service unreachable ({DETECTION_SERVICE_URL}): {e}",
        ) from e

    if status != 200:
        if isinstance(body, dict):
            detail = body.get("detail", body)
        else:
            detail = body
        raise HTTPException(status_code=status, detail=detail)

    return body
