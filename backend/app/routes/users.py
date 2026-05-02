from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_deps import get_current_user
from app.database.connection import get_db
from app.db.models.booking import Vehicle
from app.db.models.user import Driver, User
from app.schemas.user import UserOut, UserUpdateIn
from app.schemas.vehicle import VehicleCreateIn, VehicleOut

router = APIRouter(prefix="/users", tags=["users"])


def _phone_digits(value: str | None) -> str:
    if not value:
        return ""
    return "".join(c for c in value if c.isdigit())


def build_user_out(db: Session, user: User) -> UserOut:
    phone = None
    drv = db.scalar(select(Driver).where(Driver.user_id == user.id))
    if drv and drv.phone:
        phone = drv.phone
    return UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        phone=phone,
    )


@router.get("/me/profile", response_model=UserOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    return build_user_out(db, current)


@router.get("/me/vehicles", response_model=list[VehicleOut])
def get_my_vehicles(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    return db.scalars(select(Vehicle).where(Vehicle.user_id == current.id)).all()


@router.post("/me/vehicles", response_model=VehicleOut, status_code=201)
def create_my_vehicle(
    payload: VehicleCreateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    plate = payload.license_plate.strip().upper()
    existing = db.scalar(select(Vehicle).where(Vehicle.license_plate == plate))
    if existing:
        raise HTTPException(status_code=409, detail="License plate already in use")
    vehicle = Vehicle(
        user_id=current.id,
        license_plate=plate,
        make=payload.make,
        model=payload.model,
        color=payload.color,
        year=payload.year,
        title=payload.title,
        color_id=payload.color_id,
        image_url=payload.image_url,
        parked_latitude=payload.parked_latitude,
        parked_longitude=payload.parked_longitude,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.put("/me/profile", response_model=UserOut)
def update_my_profile(
    updates: UserUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if updates.full_name is not None:
        current.full_name = updates.full_name.strip()
    if updates.email is not None:
        new_email = str(updates.email).strip().lower()
        other = db.scalar(
            select(User).where(User.email == new_email, User.id != current.id)
        )
        if other:
            raise HTTPException(status_code=409, detail="Email already in use")
        current.email = new_email
    if updates.phone is not None:
        drv = db.scalar(select(Driver).where(Driver.user_id == current.id))
        if drv:
            raw = str(updates.phone).strip()
            if raw == "":
                drv.phone = None
            else:
                digits = _phone_digits(raw)
                for d in db.scalars(select(Driver)).all():
                    if d.user_id != current.id and d.phone and _phone_digits(d.phone) == digits:
                        raise HTTPException(
                            status_code=409,
                            detail="Mobile number already in use",
                        )
                drv.phone = raw
            db.add(drv)
    db.add(current)
    db.commit()
    db.refresh(current)
    return build_user_out(db, current)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
