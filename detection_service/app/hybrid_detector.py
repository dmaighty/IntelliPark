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
VEHICLE_PROXY_CLASS_IDS = {28: "suitcase", 67: "cell phone"}
DETECTION_CLASS_IDS = {**VEHICLE_CLASS_IDS, **VEHICLE_PROXY_CLASS_IDS}
MIN_SPOT_OVERLAP = 0.1
MIN_GEOMETRY_SCORE = 0.05
PROXY_MIN_CONFIDENCE = 0.45

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


def _match_geometry(spot_corners, vehicle_box, frame_shape) -> tuple[float, float]:
    spot_overlap = polygon_overlap_fraction(spot_corners, vehicle_box, frame_shape)
    spot_area = abs(cv2.contourArea(np.asarray(spot_corners, dtype=np.float32)))
    vx1, vy1, vx2, vy2 = vehicle_box
    box_area = max((vx2 - vx1) * (vy2 - vy1), 1.0)
    box_overlap = min((spot_overlap * spot_area) / box_area, 1.0)
    return spot_overlap, float(np.sqrt(spot_overlap * box_overlap))


def match_spots(spots, detections, frame_shape) -> list[dict[str, Any] | None]:
    candidates = []
    for detection_index, detection in enumerate(detections):
        confidence = detection["confidence"]
        class_id = detection["class_id"]
        if class_id in VEHICLE_PROXY_CLASS_IDS and confidence < PROXY_MIN_CONFIDENCE:
            continue

        vx1, vy1, vx2, vy2 = detection["box"]
        center = (float((vx1 + vx2) / 2), float(vy1 + (vy2 - vy1) * 0.75))

        for spot_index, spot in enumerate(spots):
            corners = normalize_spot(spot)
            spot_overlap, geometry_score = _match_geometry(
                corners, detection["box"], frame_shape
            )
            if (
                spot_overlap < MIN_SPOT_OVERLAP
                or geometry_score < MIN_GEOMETRY_SCORE
            ):
                continue

            inside = cv2.pointPolygonTest(
                np.asarray(corners, dtype=np.float32), center, False
            ) >= 0
            score = geometry_score * (0.5 + confidence / 2) * (1.2 if inside else 1)
            candidates.append(
                (score, spot_index, detection_index, spot_overlap, geometry_score)
            )

    matches: list[dict[str, Any] | None] = [None] * len(spots)
    used_detections = set()
    for _, spot_index, detection_index, spot_overlap, geometry_score in sorted(
        candidates, reverse=True
    ):
        if matches[spot_index] is not None or detection_index in used_detections:
            continue
        detection = detections[detection_index]
        matches[spot_index] = {
            **detection,
            "spot_overlap": float(spot_overlap),
            "geometry_score": float(geometry_score),
        }
        used_detections.add(detection_index)
    return matches


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
    conf: float = 0.1,
    imgsz: int = 960,
    spots: list | None = None,
    spots_path: Path | None = None,
) -> dict[str, Any]:
    """
    Decode image bytes, detect vehicles, and classify each configured spot as
    occupied/empty based on overlap with detected vehicles.

    If ``spots`` is explicitly passed (e.g. a garage level's ``defined_spots``
    from the DB), it's used as-is — including an empty list, which short-circuits
    to an empty prediction. If ``spots`` is left as ``None``, falls back to the
    bundled ``spots.json`` (or ``spots_path``) for standalone/CLI use.
    """
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    width, height = img.size
    frame = np.asarray(img)

    if spots is None:
        spots = load_spots(spots_path)

    if not spots:
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        return {
            "spots": [],
            "total_spots": 0,
            "occupied": 0,
            "empty": 0,
            "vehicles_detected": 0,
            "image_width": width,
            "image_height": height,
            "annotated_image": encode_jpeg_data_uri(frame_bgr),
        }

    model = get_hybrid_model()
    results = model.predict(
        frame,
        conf=conf,
        imgsz=imgsz,
        classes=list(DETECTION_CLASS_IDS),
        agnostic_nms=True,
        verbose=False,
    )
    r = results[0]
    detections = []
    if len(r.boxes):
        for box, confidence, class_id in zip(
            r.boxes.xyxy.cpu().numpy().tolist(),
            r.boxes.conf.cpu().numpy().tolist(),
            r.boxes.cls.cpu().numpy().astype(int).tolist(),
        ):
            detections.append(
                {
                    "box": box,
                    "confidence": float(confidence),
                    "class_id": int(class_id),
                    "detected_as": DETECTION_CLASS_IDS[int(class_id)],
                }
            )

    matches = match_spots(spots, detections, frame.shape)
    occupied_flags = [match is not None for match in matches]
    n_occupied = int(sum(occupied_flags))

    frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    annotated_bgr = annotate(frame_bgr, spots, occupied_flags)
    annotated_image = encode_jpeg_data_uri(annotated_bgr)

    spot_results = []
    for i, (spot, match) in enumerate(zip(spots, matches)):
        result = {
            "spot_id": i,
            "occupied": match is not None,
            "polygon": normalize_spot(spot),
        }
        if match:
            result["match"] = {
                "detected_as": match["detected_as"],
                "confidence": match["confidence"],
                "spot_overlap": match["spot_overlap"],
                "geometry_score": match["geometry_score"],
            }
        spot_results.append(result)

    return {
        "spots": spot_results,
        "total_spots": len(spots),
        "occupied": n_occupied,
        "empty": len(spots) - n_occupied,
        "vehicles_detected": len(detections),
        "image_width": width,
        "image_height": height,
        "annotated_image": annotated_image,
    }
