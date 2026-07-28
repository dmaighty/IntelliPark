"""Proxy inference to the detection service, using a garage's actual camera feed."""

from __future__ import annotations

import asyncio
import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.parking import ParkingLevel, ParkingLot

DETECTION_SERVICE_URL = os.environ.get(
    "DETECTION_SERVICE_URL",
    "http://127.0.0.1:8001",
).rstrip("/")

DETECTION_PREDICT_PATH = os.environ.get(
    "DETECTION_PREDICT_PATH",
    "/api/hybrid-predict",
)

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


def _pick_level(lot: ParkingLot, level_id: int | None) -> ParkingLevel:
    levels = sorted(lot.levels or [], key=lambda lv: lv.level_number)

    if level_id is not None:
        for level in levels:
            if level.id == level_id:
                return level
        raise HTTPException(status_code=404, detail="Level not found for this garage")

    for level in levels:
        if level.camera_feed_url:
            return level
    raise HTTPException(status_code=404, detail="No camera configured for this garage")


@router.get("/live-frame")
async def predict_live_frame(
    lot_id: int = Query(..., description="Parking lot (garage) id"),
    level_id: int | None = Query(
        None, description="Specific level id; defaults to the first level with a camera"
    ),
    conf: float = 0.1,
    imgsz: int = 960,
    db: Session = Depends(get_db),
):
    """
    Fetch one snapshot from the garage's camera feed and run detection via the
    detection service, using that level's manually-defined spots (if any).
    Levels with no defined spots get an empty prediction back.
    """
    lot = db.get(ParkingLot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Garage not found")

    level = _pick_level(lot, level_id)
    if not level.camera_feed_url:
        raise HTTPException(status_code=404, detail="No camera configured for this level")

    predict_url = f"{DETECTION_SERVICE_URL}{DETECTION_PREDICT_PATH}"
    params = {
        "url": level.camera_feed_url,
        "conf": conf,
        "imgsz": imgsz,
        "spots": json.dumps(level.defined_spots or []),
    }

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

    if (
        isinstance(body, dict)
        and isinstance(body.get("empty"), int)
        and isinstance(body.get("total_spots"), int)
        and body["total_spots"] > 0
    ):
        lot.spots_open = body["empty"]
        db.commit()
        body["spots_open"] = lot.spots_open

    return body
