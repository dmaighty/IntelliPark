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

engine = create_engine(DATABASE_URL)


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


with Session(engine) as session:
    lot = session.query(ParkingLot).filter_by(name="SJSU Garage A").first()

    if not lot:
        lot = ParkingLot(
            name="SJSU Garage A",
            lot_type="garage",
            address="1 Washington Sq, San Jose, CA",
            latitude=37.3352,
            longitude=-121.8811,
            total_spaces=200,
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
        spot_number="A101"
    ).first()

    if not spot:
        spot = ParkingSpot(
            parking_lot_id=lot.id,
            level_id=level.id,
            spot_number="A101",
            spot_type="regular",
            status="available",
        )
        session.add(spot)
        session.commit()
        session.refresh(spot)

    detected_status = "occupied"
    confidence_score = 0.92

    validate_detection_status(detected_status)
    validate_confidence_score(confidence_score)

    detection = OccupancyDetection(
        spot_id=spot.id,
        detected_status=detected_status,
        confidence_score=confidence_score,
        image_url="https://example.com/camera/frame-a101.jpg",
        detected_at=datetime.utcnow(),
    )

    session.add(detection)
    session.commit()

    predicted_available_spots = 35

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

    print("AI detection and prediction test data inserted successfully.")