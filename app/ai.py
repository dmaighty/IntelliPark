from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OccupancyDetection(Base):
    __tablename__ = "occupancy_detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    spot_id: Mapped[int] = mapped_column(
        ForeignKey("parking_spots.id"),
        nullable=False
    )

    detected_status: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)

    image_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AvailabilityPrediction(Base):
    __tablename__ = "availability_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    parking_lot_id: Mapped[int] = mapped_column(
        ForeignKey("parking_lots.id"),
        nullable=False
    )

    level_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("parking_levels.id"),
        nullable=True
    )

    prediction_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    predicted_available_spots: Mapped[int] = mapped_column(Integer, nullable=False)

    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)