"""Load YOLO weights and run inference on a single frame (RGB image bytes)."""

from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

from app.image_utils import encode_jpeg_data_uri

_MODEL: YOLO | None = None


def _detection_color(class_name: str) -> tuple[int, int, int]:
    """BGR color for a detection box, keyed off class name (e.g. "space-occupied")."""
    name = (class_name or "").lower()
    if "occupied" in name:
        return (0, 0, 255)  # red
    if "empty" in name:
        return (0, 255, 0)  # green
    return (255, 122, 0)  # blue-ish, for anything else (e.g. plain "car")


def default_model_path() -> Path:
    override = os.environ.get("DETECTION_MODEL_PATH")
    if override:
        return Path(override).expanduser().resolve()
    return Path(__file__).resolve().parent / "yolo_models" / "best.pt"


def get_model() -> YOLO:
    global _MODEL
    if _MODEL is None:
        path = default_model_path()
        if not path.is_file():
            raise FileNotFoundError(
                f"Model weights not found at {path}. "
                "Place best.pt in app/yolo_models"
            )
        _MODEL = YOLO(str(path))
    return _MODEL


def annotate_detections(frame_bgr: np.ndarray, detections: list[dict[str, Any]]) -> np.ndarray:
    """Draw each detection's box + label on the frame.
    Expects (and returns) a BGR frame, per OpenCV convention."""
    out = frame_bgr.copy()
    for d in detections:
        box = d["box"]
        x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
        color = _detection_color(d["class_name"])
        label = f"{d['class_name']} {d['confidence']:.2f}"
        cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
        cv2.putText(out, label, (x1, max(y1 - 6, 0)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return out


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

    frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    annotated_bgr = annotate_detections(frame_bgr, detections)
    annotated_image = encode_jpeg_data_uri(annotated_bgr)

    return {
        "detections": detections,
        "image_width": width,
        "image_height": height,
        "annotated_image": annotated_image,
    }
