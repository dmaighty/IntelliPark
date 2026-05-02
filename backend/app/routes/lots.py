from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.parking import ParkingLot, ParkingSpot
from app.schemas.parking import NearbyLotOut, ParkingLotOut, ParkingSpotOut

router = APIRouter(prefix="/lots", tags=["lots"])


@router.get("", response_model=list[ParkingLotOut])
def list_lots(db: Session = Depends(get_db)):
    rows = db.scalars(select(ParkingLot).order_by(ParkingLot.id)).all()
    return rows


@router.get("/nearby", response_model=list[NearbyLotOut])
def lots_nearby(
    db: Session = Depends(get_db),
    lat: float = Query(..., description="User latitude"),
    lon: float | None = Query(None, description="Reserved for when lots store longitude"),
    radius_km: float = Query(10.0, ge=0.1, le=500.0),
):
    _ = lon, radius_km
    rows = db.scalars(
        select(ParkingLot).where(ParkingLot.latitude.isnot(None))
    ).all()
    scored = [
        (
            abs(float(lot.latitude) - lat),
            lot,
        )
        for lot in rows
    ]
    scored.sort(key=lambda x: x[0])
    return [
        NearbyLotOut(
            id=lot.id,
            name=lot.name,
            lot_type=lot.lot_type,
            address=lot.address,
            latitude=lot.latitude,
            longitude=lot.longitude,
            rating=lot.rating,
            rate_per_hour=lot.rate_per_hour,
            details=lot.details,
            schedule=lot.schedule,
            peak_times=lot.peak_times,
            spots_open=lot.spots_open,
            total_spaces=lot.total_spaces,
            distance_score=score,
        )
        for score, lot in scored
    ]


@router.get("/{lot_id}/spots", response_model=list[ParkingSpotOut])
def list_lot_spots(lot_id: int, db: Session = Depends(get_db)):
    lot = db.get(ParkingLot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    rows = db.scalars(
        select(ParkingSpot).where(ParkingSpot.parking_lot_id == lot_id)
    ).all()
    return rows
