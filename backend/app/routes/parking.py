from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.parking import ParkingLot
from app.schemas.parking import ParkingLotOut

router = APIRouter(prefix="/parking", tags=["parking"])


@router.get("/lots", response_model=list[ParkingLotOut])
def list_parking_lots(db: Session = Depends(get_db)):
    return db.scalars(select(ParkingLot).order_by(ParkingLot.id)).all()
