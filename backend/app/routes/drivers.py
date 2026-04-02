from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.booking import ParkingSession, Payment, Vehicle
from app.db.models.user import Driver, User
from app.schemas.booking import ParkingSessionOut, PaymentOut
from app.schemas.user import DriverOut, UserOut
from app.schemas.vehicle import VehicleOut

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("/{driver_id}", response_model=dict)
def get_driver_profile(driver_id: int, db: Session = Depends(get_db)):
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    user = db.get(User, driver.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "driver": DriverOut.model_validate(driver),
        "user": UserOut.model_validate(user),
    }


@router.get("/{driver_id}/vehicles", response_model=list[VehicleOut])
def list_driver_vehicles(driver_id: int, db: Session = Depends(get_db)):
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    rows = db.scalars(
        select(Vehicle).where(Vehicle.driver_id == driver_id)
    ).all()
    return rows


@router.get("/{driver_id}/sessions", response_model=list[ParkingSessionOut])
def list_driver_sessions(driver_id: int, db: Session = Depends(get_db)):
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    rows = db.scalars(
        select(ParkingSession).where(ParkingSession.driver_id == driver_id)
    ).all()
    return rows


@router.get("/{driver_id}/payments", response_model=list[PaymentOut])
def list_driver_payments(driver_id: int, db: Session = Depends(get_db)):
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    rows = db.scalars(
        select(Payment)
        .join(ParkingSession, Payment.session_id == ParkingSession.id)
        .where(ParkingSession.driver_id == driver_id)
    ).all()
    return rows
