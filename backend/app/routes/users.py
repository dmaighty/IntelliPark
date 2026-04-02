from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me/profile", response_model=UserOut)
def get_my_profile(
    db: Session = Depends(get_db),
    x_user_id: int | None = Header(None, alias="X-User-Id"),
):
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
