from typing import Any, Optional
from sqlalchemy import String, Integer, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    lot_type: Mapped[str] = mapped_column(String(20), nullable=False)  # open_lot / garage
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rate_per_hour: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    schedule: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    peak_times: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    spots_open: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_spaces: Mapped[int] = mapped_column(Integer, nullable=False)

    levels = relationship("ParkingLevel", back_populates="parking_lot")
    spots = relationship("ParkingSpot", back_populates="parking_lot")


class ParkingLevel(Base):
    __tablename__ = "parking_levels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parking_lot_id: Mapped[int] = mapped_column(ForeignKey("parking_lots.id"), nullable=False)
    level_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    parking_lot = relationship("ParkingLot", back_populates="levels")
    spots = relationship("ParkingSpot", back_populates="level")


class ParkingSpot(Base):
    __tablename__ = "parking_spots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parking_lot_id: Mapped[int] = mapped_column(ForeignKey("parking_lots.id"), nullable=False)
    level_id: Mapped[Optional[int]]= mapped_column(ForeignKey("parking_levels.id"), nullable=True)
    spot_number: Mapped[str] = mapped_column(String(20), nullable=False)
    spot_type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="available")

    parking_lot = relationship("ParkingLot", back_populates="spots")
    level = relationship("ParkingLevel", back_populates="spots")