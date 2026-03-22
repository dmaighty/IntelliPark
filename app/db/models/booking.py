from typing import Optional
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=False)
    license_plate: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    make: Mapped[Optional[str]]= mapped_column(String(50), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=False)
    spot_id: Mapped[int] = mapped_column(ForeignKey("parking_spots.id"), nullable=False)
    reserved_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    reserved_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")


class ParkingSession(Base):
    __tablename__ = "parking_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=False)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    spot_id: Mapped[int] = mapped_column(ForeignKey("parking_spots.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    fee_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("parking_sessions.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), nullable=False)
    paid_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)