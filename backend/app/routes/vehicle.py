from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleOut

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

# get all vehicles for a driver
@router.get("/{user_id}/vehicles", response_model=list[VehicleOut])
def get_all_vehicles_for_driver(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    vehicles = db.scalars(select(Vehicle).where(Vehicle.driver_id == user_id)).all()
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
@router.post("/", response_model=VehicleOut)
def create_vehicle(vehicle: VehicleIn, db: Session = Depends(get_db)):
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle