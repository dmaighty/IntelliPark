from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.parking import ParkingLot, ParkingSpot
from app.schemas.parking import NearbyLotOut, ParkingLotOut, ParkingSpotOut
from app.utils.geo import haversine_km

router = APIRouter(prefix="/lots", tags=["lots"])


def find_nearby_lots(
    db: Session,
    lat: float,
    lon: float,
    radius_km: float = 10.0,
    lot_type: str | None = None,
) -> list[NearbyLotOut]:
    """Shared by the /lots/nearby endpoint and the parking-chat tool."""
    rows = db.scalars(
        select(ParkingLot).where(
            ParkingLot.latitude.isnot(None), ParkingLot.longitude.isnot(None)
        )
    ).all()

    if lot_type:
        rows = [row for row in rows if row.lot_type == lot_type]

    scored = [
        (haversine_km(lat, lon, float(row.latitude), float(row.longitude)), row)
        for row in rows
    ]
    scored = [(distance, row) for distance, row in scored if distance <= radius_km]
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
            distance_score=round(distance_km, 3),
        )
        for distance_km, lot in scored
    ]


@router.get("", response_model=list[ParkingLotOut])
def list_lots(db: Session = Depends(get_db)):
    rows = db.scalars(select(ParkingLot).order_by(ParkingLot.id)).all()
    return rows


@router.get("/nearby", response_model=list[NearbyLotOut])
def lots_nearby(
    db: Session = Depends(get_db),
    lat: float = Query(..., description="User latitude"),
    lon: float = Query(..., description="User longitude"),
    radius_km: float = Query(10.0, ge=0.1, le=500.0),
    lot_type: str | None = Query(
        None, description="Filter to a specific lot_type, e.g. 'garage' or 'open_lot'"
    ),
):
    return find_nearby_lots(db, lat, lon, radius_km, lot_type)


@router.get("/{lot_id}/spots", response_model=list[ParkingSpotOut])
def list_lot_spots(lot_id: int, db: Session = Depends(get_db)):
    lot = db.get(ParkingLot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    rows = db.scalars(
        select(ParkingSpot).where(ParkingSpot.parking_lot_id == lot_id)
    ).all()
    return rows
