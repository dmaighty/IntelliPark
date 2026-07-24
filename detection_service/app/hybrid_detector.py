"""Hybrid parking-spot detector.
"""

from __future__ import annotations

import json
import os
from io import BytesIO
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

from app.image_utils import encode_jpeg_data_uri

VEHICLE_CLASS_IDS = {2: "car", 5: "bus", 7: "truck"}
OVERLAP_THRESHOLD = 0.3  # fraction of spot area covered by a vehicle box to call it "occupied"

_HYBRID_YOLO_DIR = Path(__file__).resolve().parent.parent / "hybrid_yolo"

_HYBRID_MODEL: YOLO | None = None


def default_hybrid_model_path() -> str:
    """Path (or name) of the pretrained COCO YOLO weights used for vehicle detection."""
    override = os.environ.get("HYBRID_MODEL_PATH")
    if override:
        return str(Path(override).expanduser().resolve())
    bundled = _HYBRID_YOLO_DIR / "yolov8s.pt"
    # Fall back to the bare name so ultralytics can auto-download it if the
    # bundled weights aren't present.
    return str(bundled) if bundled.is_file() else "yolov8s.pt"


def get_hybrid_model() -> YOLO:
    global _HYBRID_MODEL
    if _HYBRID_MODEL is None:
        _HYBRID_MODEL = YOLO(default_hybrid_model_path())
    return _HYBRID_MODEL


def default_spots_path() -> Path:
    """Path to the spot-polygon definitions used by the hybrid detector.

    TODO: replace with a per-garage lookup (e.g. from the DB) instead of a
    single shared file.
    """
    override = os.environ.get("HYBRID_SPOTS_PATH")
    if override:
        return Path(override).expanduser().resolve()
    return _HYBRID_YOLO_DIR / "spots.json"


def load_spots(spots_path: Path | None = None) -> list:
    path = spots_path or default_spots_path()
    if not path.is_file():
        raise FileNotFoundError(f"Spots file not found at {path}.")
    with open(path) as f:
        return json.load(f)


def normalize_spot(spot):
    """Accept either legacy [x1,y1,x2,y2] boxes or [[x,y]*4] polygons.
    Always returns a list of (x, y) corner points."""
    if len(spot) == 4 and all(isinstance(v, (int, float)) for v in spot):
        x1, y1, x2, y2 = spot
        return [(x1, y1), (x2, y1), (x2, y2), (x1, y2)]
    return [(p[0], p[1]) for p in spot]


def polygon_overlap_fraction(spot_corners, vehicle_box, frame_shape) -> float:
    """Fraction of the spot polygon's area covered by an axis-aligned vehicle box,
    computed via mask rasterization so it works for slanted/rotated spots."""
    h, w = frame_shape[:2]

    xs = [p[0] for p in spot_corners]
    ys = [p[1] for p in spot_corners]
    pad = 5
    x0 = max(0, int(min(xs)) - pad)
    y0 = max(0, int(min(ys)) - pad)
    x1 = min(w, int(max(xs)) + pad)
    y1 = min(h, int(max(ys)) + pad)
    if x1 <= x0 or y1 <= y0:
        return 0.0

    local_w, local_h = x1 - x0, y1 - y0
    spot_mask = np.zeros((local_h, local_w), dtype=np.uint8)
    spot_pts = np.array([[int(px - x0), int(py - y0)] for px, py in spot_corners], dtype=np.int32)
    cv2.fillPoly(spot_mask, [spot_pts], 1)

    vx1, vy1, vx2, vy2 = vehicle_box
    veh_mask = np.zeros((local_h, local_w), dtype=np.uint8)
    veh_pts = np.array([
        [int(vx1 - x0), int(vy1 - y0)],
        [int(vx2 - x0), int(vy1 - y0)],
        [int(vx2 - x0), int(vy2 - y0)],
        [int(vx1 - x0), int(vy2 - y0)],
    ], dtype=np.int32)
    cv2.fillPoly(veh_mask, [veh_pts], 1)

    spot_area = spot_mask.sum()
    if spot_area == 0:
        return 0.0
    inter_area = np.logical_and(spot_mask, veh_mask).sum()
    return inter_area / spot_area


def classify_spots(spots, vehicle_boxes, frame_shape) -> list[bool]:
    """Return a list of bools, True = occupied, one per spot."""
    occupied = []
    for spot in spots:
        corners = normalize_spot(spot)
        best = max(
            (polygon_overlap_fraction(corners, vb, frame_shape) for vb in vehicle_boxes),
            default=0.0,
        )
        occupied.append(best >= OVERLAP_THRESHOLD)
    return occupied


def annotate(frame_bgr: np.ndarray, spots, occupied_flags) -> np.ndarray:
    """Draw each spot polygon on the frame, color-coded occupied/empty.
    Expects (and returns) a BGR frame, per OpenCV convention."""
    out = frame_bgr.copy()
    for spot, occ in zip(spots, occupied_flags):
        corners = normalize_spot(spot)
        color = (0, 0, 255) if occ else (0, 255, 0)  # BGR: red=occupied, green=empty
        label = "occupied" if occ else "empty"
        pts = np.array(corners, dtype=np.int32).reshape(-1, 1, 2)
        cv2.polylines(out, [pts], isClosed=True, color=color, thickness=2)
        label_pt = (int(min(c[0] for c in corners)), int(min(c[1] for c in corners)) - 6)
        cv2.putText(out, label, (label_pt[0], max(label_pt[1], 0)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return out


def predict_hybrid_from_bytes(
    image_bytes: bytes,
    *,
    conf: float = 0.25,
    spots_path: Path | None = None,
) -> dict[str, Any]:
    """
    Decode image bytes, detect vehicles, and classify each configured spot as
    occupied/empty based on overlap with detected vehicles.
    """
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    width, height = img.size
    frame = np.asarray(img)

    spots = load_spots(spots_path)

    model = get_hybrid_model()
    results = model.predict(frame, conf=conf, classes=list(VEHICLE_CLASS_IDS.keys()), verbose=False)
    r = results[0]
    vehicle_boxes = r.boxes.xyxy.cpu().numpy().tolist() if len(r.boxes) else []

    occupied_flags = classify_spots(spots, vehicle_boxes, frame.shape)
    n_occupied = int(sum(occupied_flags))

    frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    annotated_bgr = annotate(frame_bgr, spots, occupied_flags)
    annotated_image = encode_jpeg_data_uri(annotated_bgr)

    spot_results = [
        {"spot_id": i, "occupied": bool(occ), "polygon": normalize_spot(spot)}
        for i, (spot, occ) in enumerate(zip(spots, occupied_flags))
    ]

    return {
        "spots": spot_results,
        "total_spots": len(spots),
        "occupied": n_occupied,
        "empty": len(spots) - n_occupied,
        "vehicles_detected": len(vehicle_boxes),
        "image_width": width,
        "image_height": height,
        "annotated_image": annotated_image,
    }
