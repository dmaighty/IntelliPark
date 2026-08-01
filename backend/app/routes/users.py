from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_deps import get_current_user
from app.config.settings import settings
from app.database.connection import get_db
from app.db.models.booking import Vehicle
from app.db.models.user import Driver, User
from app.schemas.user import (
    PasswordResetConfirmResponse,
    PasswordResetEmailResponse,
    PasswordResetSmsConfirmIn,
    PasswordResetSmsSendResponse,
    UserOut,
    UserUpdateIn,
)
from app.schemas.vehicle import VehicleCreateIn, VehicleOut
from app.services.notifications import send_password_reset_email, send_password_reset_sms
from app.services.password_reset import (
    create_email_reset_token,
    create_sms_reset_code,
    verify_sms_reset_code,
)
from app.security import hash_password, validate_password_strength

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
        profile_image_url=user.profile_image_url,
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
        if not drv:
            drv = Driver(user_id=current.id)
            db.add(drv)
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
    if updates.profile_image_url is not None:
        raw_image = str(updates.profile_image_url).strip()
        current.profile_image_url = raw_image or None
    db.add(current)
    db.commit()
    db.refresh(current)
    return build_user_out(db, current)


def _should_expose_dev_reset() -> bool:
    return os.environ.get("APP_ENV", "development").lower() in {
        "development",
        "dev",
        "local",
    }


@router.post("/me/password-reset/email", response_model=PasswordResetEmailResponse)
def request_password_reset_email(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    profile = build_user_out(db, current)
    reset = create_email_reset_token(
        user_id=current.id,
        base_url=settings.password_reset_base_url,
    )
    emailed = send_password_reset_email(
        to_email=profile.email,
        reset_link=reset.reset_link,
    )

    message = (
        f"We emailed a password reset link to {profile.email}."
        if emailed
        else f"A password reset link was generated for {profile.email}."
    )

    return PasswordResetEmailResponse(
        message=message,
        email=profile.email,
        dev_reset_link=reset.reset_link if _should_expose_dev_reset() and not emailed else None,
    )


@router.post("/me/password-reset/sms/send", response_model=PasswordResetSmsSendResponse)
def send_password_reset_sms_code(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    profile = build_user_out(db, current)

    if not profile.phone:
        raise HTTPException(
            status_code=400,
            detail="Add a mobile number in Personal Info before using text verification.",
        )

    code = create_sms_reset_code(user_id=current.id)
    sent = send_password_reset_sms(to_phone=profile.phone, code=code)

    message = (
        f"We texted a verification code to {profile.phone}."
        if sent
        else f"A verification code was generated for {profile.phone}."
    )

    return PasswordResetSmsSendResponse(
        message=message,
        phone=profile.phone,
        dev_code=code if _should_expose_dev_reset() and not sent else None,
    )


@router.post(
    "/me/password-reset/sms/confirm",
    response_model=PasswordResetConfirmResponse,
)
def confirm_password_reset_sms(
    body: PasswordResetSmsConfirmIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    validate_password_strength(body.new_password)

    if not verify_sms_reset_code(user_id=current.id, code=body.code):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    current.password_hash = hash_password(body.new_password)
    db.add(current)
    db.commit()

    return PasswordResetConfirmResponse(message="Password updated successfully.")


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
