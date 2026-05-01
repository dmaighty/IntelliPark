from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.booking import Vehicle
from app.db.models.user import User
from app.schemas.vehicle import VehicleCreateIn, VehicleOut

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

# get all vehicles for a user
@router.get("/{user_id}/vehicles", response_model=list[VehicleOut])
def get_all_vehicles_for_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    vehicles = db.scalars(select(Vehicle).where(Vehicle.user_id == user_id)).all()
    return vehicles

# update vehicle
@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(vehicle_id: int, updates: dict, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for key, value in updates.items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle

# create vehicle
@router.post("/", response_model=VehicleOut, status_code=201)
def create_vehicle(vehicle: VehicleCreateIn, user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.scalar(
        select(Vehicle).where(Vehicle.license_plate == vehicle.license_plate.upper())
    )
    if existing:
        raise HTTPException(status_code=409, detail="License plate already in use")
    row = Vehicle(
        user_id=user_id,
        license_plate=vehicle.license_plate.upper(),
        make=vehicle.make,
        model=vehicle.model,
        color=vehicle.color,
        year=vehicle.year,
        title=vehicle.title,
        color_id=vehicle.color_id,
        image_url=vehicle.image_url,
        parked_latitude=vehicle.parked_latitude,
        parked_longitude=vehicle.parked_longitude,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row