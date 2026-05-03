"""Load YOLO weights and run inference on a single frame (RGB image bytes)."""

from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image
from ultralytics import YOLO

_MODEL: YOLO | None = None


def default_model_path() -> Path:
    override = os.environ.get("DETECTION_MODEL_PATH")
    if override:
        return Path(override).expanduser().resolve()
    return Path(__file__).resolve().parent / "models" / "best.pt"


def get_model() -> YOLO:
    global _MODEL
    if _MODEL is None:
        path = default_model_path()
        if not path.is_file():
            raise FileNotFoundError(
                f"Model weights not found at {path}. "
                "Place best.pt in app/models/ or set DETECTION_MODEL_PATH."
            )
        _MODEL = YOLO(str(path))
    return _MODEL


def predict_from_bytes(
    image_bytes: bytes,
    *,
    conf: float = 0.25,
    imgsz: int = 640,
) -> dict[str, Any]:
    """
    Decode image bytes, run YOLO once, return serializable predictions.
    """
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    width, height = img.size
    frame = np.asarray(img)

    model = get_model()
    results = model.predict(
        source=frame,
        conf=conf,
        imgsz=imgsz,
        save=False,
        verbose=False,
    )
    result = results[0]
    names = result.names or model.names

    detections: list[dict[str, Any]] = []
    if result.boxes is not None:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            if isinstance(names, dict):
                class_name = str(names.get(class_id, class_id))
            else:
                class_name = str(names[class_id])

            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": round(confidence, 4),
                    "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                }
            )

    return {
        "detections": detections,
        "image_width": width,
        "image_height": height,
    }
