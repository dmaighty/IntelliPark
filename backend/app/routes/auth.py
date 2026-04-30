from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.user import Driver, User
from app.schemas.user import LoginIn, TokenOut, UserOut, UserRegisterIn
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _normalize_phone(value: str) -> str:
    return "".join(c for c in value if c.isdigit())


@router.post("/register", response_model=TokenOut)
def register(body: UserRegisterIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    mobile_digits = _normalize_phone(body.mobile)
    drivers = db.scalars(select(Driver)).all()
    for d in drivers:
        if d.phone and _normalize_phone(d.phone) == mobile_digits:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Mobile number already registered",
            )
    full_name = f"{body.first_name.strip()} {body.last_name.strip()}"
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(body.password),
        role="driver",
    )
    db.add(user)
    db.flush()
    driver = Driver(user_id=user.id, phone=body.mobile.strip())
    db.add(driver)
    db.commit()
    db.refresh(user)
    token = create_access_token(
        sub=user.email, user_id=user.id, role=user.role
    )
    return TokenOut(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    raw = body.identifier.strip()
    user = None
    if "@" in raw:
        user = db.scalar(select(User).where(User.email == raw.lower()))
    else:
        digits = _normalize_phone(raw)
        drivers = db.scalars(select(Driver)).all()
        for d in drivers:
            if d.phone and _normalize_phone(d.phone) == digits:
                user = db.get(User, d.user_id)
                break
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect identifier or password",
        )
    token = create_access_token(
        sub=user.email, user_id=user.id, role=user.role
    )