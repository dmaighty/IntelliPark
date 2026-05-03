"""
Core Feature Validation + Accuracy Tuning Test

Purpose:
- Validate the main AI parking detection flow
- Insert detection data
- Compare predicted status against actual status
- Calculate accuracy
- Tune confidence threshold
"""
import sys
import os


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import DATABASE_URL
from app.db.models import ParkingLot, ParkingLevel, ParkingSpot, OccupancyDetection

engine = create_engine(DATABASE_URL)


def validate_status(status):
    allowed_statuses = ["available", "occupied", "unknown"]
    if status not in allowed_statuses:
        raise ValueError(f"Invalid status: {status}")


def validate_confidence(confidence):
    if confidence < 0 or confidence > 1:
        raise ValueError("Confidence score must be between 0 and 1")


def tune_detection_status(detected_status, confidence_score, threshold=0.80):
    """
    If confidence is below threshold, mark detection as unknown.
    This prevents low-confidence AI results from changing parking status.
    """
    if confidence_score < threshold:
        return "unknown"
    return detected_status


def calculate_accuracy(results):
    """
    results format:
    [
        {"actual": "occupied", "predicted": "occupied"},
        {"actual": "available", "predicted": "occupied"}
    ]
    """
    correct = 0

    for item in results:
        if item["actual"] == item["predicted"]:
            correct += 1

    return correct / len(results)


with Session(engine) as session:
    print("Starting core feature validation...")

    lot = session.query(ParkingLot).filter_by(name="Accuracy Test Garage").first()

    if not lot:
        lot = ParkingLot(
            name="Accuracy Test Garage",
            lot_type="garage",
            address="Test Location",
            latitude=37.0,
            longitude=-121.0,
            total_spaces=50,
        )
        session.add(lot)
        session.commit()
        session.refresh(lot)

    level = session.query(ParkingLevel).filter_by(
        parking_lot_id=lot.id,
        level_number=1
    ).first()

    if not level:
        level = ParkingLevel(
            parking_lot_id=lot.id,
            level_number=1,
            name="Level 1",
        )
        session.add(level)
        session.commit()
        session.refresh(level)

    spot = session.query(ParkingSpot).filter_by(
        parking_lot_id=lot.id,
        spot_number="CV101"
    ).first()

    if not spot:
        spot = ParkingSpot(
            parking_lot_id=lot.id,
            level_id=level.id,
            spot_number="CV101",
            spot_type="regular",
            status="available",
        )
        session.add(spot)
        session.commit()
        session.refresh(spot)

    # Sample AI results from model
    test_results = [
        {"actual": "occupied", "detected": "occupied", "confidence": 0.95},
        {"actual": "available", "detected": "available", "confidence": 0.91},
        {"actual": "occupied", "detected": "occupied", "confidence": 0.72},
        {"actual": "available", "detected": "occupied", "confidence": 0.64},
        {"actual": "occupied", "detected": "available", "confidence": 0.58},
    ]

    tuned_results = []

    threshold = 0.80

    for result in test_results:
        validate_status(result["actual"])
        validate_status(result["detected"])
        validate_confidence(result["confidence"])

        tuned_status = tune_detection_status(
            result["detected"],
            result["confidence"],
            threshold
        )

        detection = OccupancyDetection(
            spot_id=spot.id,
            detected_status=tuned_status,
            confidence_score=result["confidence"],
            image_url="https://example.com/test-frame.jpg",
            detected_at=datetime.utcnow(),
        )

        session.add(detection)

        tuned_results.append({
            "actual": result["actual"],
            "predicted": tuned_status
        })

    session.commit()

    usable_results = [
        item for item in tuned_results if item["predicted"] != "unknown"
    ]

    if usable_results:
        accuracy = calculate_accuracy(usable_results)
    else:
        accuracy = 0

    print("Core validation completed.")
    print("Confidence threshold:", threshold)
    print("Total samples:", len(test_results))
    print("Usable samples after tuning:", len(usable_results))
    print("Accuracy after tuning:", round(accuracy * 100, 2), "%")

    print("Tuned Results:")
    for item in tuned_results:
        print(item)