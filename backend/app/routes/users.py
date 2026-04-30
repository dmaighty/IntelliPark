from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_deps import get_current_user
from app.database.connection import get_db
from app.db.models.user import User
from app.schemas.user import UserOut, UserUpdateIn

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/profile", response_model=UserOut)
def get_my_profile(
    current: User = Depends(get_current_user),
):
    return current


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
    db.add(current)
    db.commit()
    db.refresh(current)
    return current


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
