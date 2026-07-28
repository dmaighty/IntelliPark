from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth_deps import require_admin
from app.database.connection import get_db
from app.db.models.parking import ParkingLevel, ParkingLot
from app.db.models.user import User
from app.schemas.admin import (
    DefinedSpotsIn,
    ParkingLevelCreateIn,
    ParkingLevelDetailOut,
    ParkingLevelOut,
    ParkingLevelUpdateIn,
    ParkingLotAdminOut,
    ParkingLotCreateIn,
    ParkingLotUpdateIn,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _spot_count(level: ParkingLevel) -> int:
    spots = level.defined_spots
    return len(spots) if isinstance(spots, list) else 0


def _level_out(level: ParkingLevel) -> ParkingLevelOut:
    return ParkingLevelOut(
        id=level.id,
        parking_lot_id=level.parking_lot_id,
        level_number=level.level_number,
        name=level.name,
        camera_feed_url=level.camera_feed_url,
        spot_count=_spot_count(level),
    )


def _lot_out(lot: ParkingLot) -> ParkingLotAdminOut:
    levels = sorted(lot.levels or [], key=lambda lv: lv.level_number)
    return ParkingLotAdminOut(
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
        levels=[_level_out(lv) for lv in levels],
    )


@router.get("/lots", response_model=list[ParkingLotAdminOut])
def list_lots(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = db.scalars(
        select(ParkingLot)
        .options(selectinload(ParkingLot.levels))
        .order_by(ParkingLot.id)
    ).all()
    return [_lot_out(lot) for lot in rows]


@router.post("/lots", response_model=ParkingLotAdminOut, status_code=status.HTTP_201_CREATED)
def create_lot(
    body: ParkingLotCreateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    lot = ParkingLot(
        name=body.name.strip(),
        lot_type=body.lot_type.strip(),
        address=body.address.strip(),
        latitude=body.latitude,
        longitude=body.longitude,
        rating=body.rating,
        rate_per_hour=body.rate_per_hour,
        details=body.details,
        schedule=body.schedule,
        spots_open=body.spots_open,
        total_spaces=body.total_spaces,
    )
    db.add(lot)
    db.flush()

    camera = (body.camera_feed_url or "").strip()
    if camera:
        level = ParkingLevel(
            parking_lot_id=lot.id,
            level_number=1,
            name="Level 1",
            camera_feed_url=camera,
        )
        db.add(level)

    db.commit()
    lot = db.scalar(
        select(ParkingLot)
        .options(selectinload(ParkingLot.levels))
        .where(ParkingLot.id == lot.id)
    )
    return _lot_out(lot)


@router.get("/lots/{lot_id}", response_model=ParkingLotAdminOut)
def get_lot(
    lot_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    lot = db.scalar(
        select(ParkingLot)
        .options(selectinload(ParkingLot.levels))
        .where(ParkingLot.id == lot_id)
    )
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    return _lot_out(lot)


@router.patch("/lots/{lot_id}", response_model=ParkingLotAdminOut)
def update_lot(
    lot_id: int,
    body: ParkingLotUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    lot = db.scalar(
        select(ParkingLot)
        .options(selectinload(ParkingLot.levels))
        .where(ParkingLot.id == lot_id)
    )
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")

    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(lot, key, value)

    db.commit()
    db.refresh(lot)
    lot = db.scalar(
        select(ParkingLot)
        .options(selectinload(ParkingLot.levels))
        .where(ParkingLot.id == lot_id)
    )
    return _lot_out(lot)


@router.post(
    "/lots/{lot_id}/levels",
    response_model=ParkingLevelOut,
    status_code=status.HTTP_201_CREATED,
)
def create_level(
    lot_id: int,
    body: ParkingLevelCreateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    lot = db.get(ParkingLot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")

    level = ParkingLevel(
        parking_lot_id=lot_id,
        level_number=body.level_number,
        name=body.name.strip(),
        camera_feed_url=(body.camera_feed_url or "").strip() or None,
    )
    db.add(level)
    db.commit()
    db.refresh(level)
    return _level_out(level)


@router.get("/levels/{level_id}", response_model=ParkingLevelDetailOut)
def get_level(
    level_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    level = db.get(ParkingLevel, level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Parking level not found")
    return ParkingLevelDetailOut(
        id=level.id,
        parking_lot_id=level.parking_lot_id,
        level_number=level.level_number,
        name=level.name,
        camera_feed_url=level.camera_feed_url,
        defined_spots=level.defined_spots,
        spot_count=_spot_count(level),
    )


@router.patch("/levels/{level_id}", response_model=ParkingLevelOut)
def update_level(
    level_id: int,
    body: ParkingLevelUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    level = db.get(ParkingLevel, level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Parking level not found")

    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip() or None
        setattr(level, key, value)

    db.commit()
    db.refresh(level)
    return _level_out(level)


@router.put("/levels/{level_id}/spots", response_model=ParkingLevelDetailOut)
def put_defined_spots(
    level_id: int,
    body: DefinedSpotsIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    level = db.get(ParkingLevel, level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Parking level not found")

    for i, spot in enumerate(body.spots):
        if len(spot) != 4:
            raise HTTPException(
                status_code=400,
                detail=f"Spot {i} must have exactly 4 corners",
            )
        for corner in spot:
            if len(corner) != 2:
                raise HTTPException(
                    status_code=400,
                    detail=f"Spot {i} corners must be [x, y] pairs",
                )

    level.defined_spots = body.spots
    db.commit()
    db.refresh(level)
    return ParkingLevelDetailOut(
        id=level.id,
        parking_lot_id=level.parking_lot_id,
        level_number=level.level_number,
        name=level.name,
        camera_feed_url=level.camera_feed_url,
        defined_spots=level.defined_spots,
        spot_count=_spot_count(level),
    )
