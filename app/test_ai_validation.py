"""
AI Detection & Prediction Validation Test

Purpose:
- Test database integration for:
    - occupancy_detections
    - availability_predictions
- Validate input rules before inserting data
"""

from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import DATABASE_URL
from app.db.models import (
    ParkingLot,
    ParkingLevel,
    ParkingSpot,
    OccupancyDetection,
    AvailabilityPrediction,
)

# Create DB engine
engine = create_engine(DATABASE_URL)


# -----------------------------
# VALIDATION FUNCTIONS
# -----------------------------

def validate_detection_status(status):
    allowed = ["available", "occupied", "unknown"]
    if status not in allowed:
        raise ValueError(f"Invalid detected_status: {status}")


def validate_confidence_score(score):
    if score < 0 or score > 1:
        raise ValueError("confidence_score must be between 0 and 1")


def validate_predicted_available_spots(value):
    if value < 0:
        raise ValueError("predicted_available_spots cannot be negative")


# -----------------------------
# TEST EXECUTION
# -----------------------------

with Session(engine) as session:
    print("Starting AI validation test...")

    # -----------------------------------
    # Ensure parking lot exists
    # -----------------------------------
    lot = session.query(ParkingLot).filter_by(name="Test Garage").first()

    if not lot:
        lot = ParkingLot(
            name="Test Garage",
            lot_type="garage",
            address="Test Address",
            latitude=37.0,
            longitude=-121.0,
            total_spaces=100,
        )
        session.add(lot)
        session.commit()
        session.refresh(lot)
        print("Created test parking lot")

    # -----------------------------------
    # Ensure level exists
    # -----------------------------------
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
        print("Created test parking level")

    # -----------------------------------
    # Ensure parking spot exists
    # -----------------------------------
    spot = session.query(ParkingSpot).filter_by(
        parking_lot_id=lot.id,
        spot_number="T101"
    ).first()

    if not spot:
        spot = ParkingSpot(
            parking_lot_id=lot.id,
            level_id=level.id,
            spot_number="T101",
            spot_type="regular",
            status="available",
        )
        session.add(spot)
        session.commit()
        session.refresh(spot)
        print("Created test parking spot")

    # -----------------------------------
    # TEST 1: Occupancy Detection Insert
    # -----------------------------------
    print("Running detection validation...")

    detected_status = "occupied"
    confidence_score = 0.95

    validate_detection_status(detected_status)
    validate_confidence_score(confidence_score)

    detection = OccupancyDetection(
        spot_id=spot.id,
        detected_status=detected_status,
        confidence_score=confidence_score,
        image_url="https://example.com/frame.jpg",
        detected_at=datetime.utcnow(),
    )

    session.add(detection)
    session.commit()

    print("Detection inserted successfully")

    # -----------------------------------
    # TEST 2: Availability Prediction Insert
    # -----------------------------------
    print("Running prediction validation...")

    predicted_available_spots = 25

    validate_predicted_available_spots(predicted_available_spots)

    prediction = AvailabilityPrediction(
        parking_lot_id=lot.id,
        level_id=level.id,
        prediction_time=datetime.utcnow() + timedelta(hours=1),
        predicted_available_spots=predicted_available_spots,
        model_version="v1.0",
    )

    session.add(prediction)
    session.commit()

    print("Prediction inserted successfully")

    # -----------------------------------
    # TEST 3: Negative Test (Validation Failure)
    # -----------------------------------
    print("Running negative validation test...")

    try:
        validate_confidence_score(1.5)  # invalid
    except ValueError as e:
        print("Validation correctly failed:", e)

    print("All AI validation tests completed successfully.")
