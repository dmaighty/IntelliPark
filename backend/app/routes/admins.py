from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.db.models.user import Admin, User
from app.schemas.user import UserOut

router = APIRouter(prefix="/admins", tags=["admins"])


@router.get("/{admin_id}/profile", response_model=dict)
def get_admin_profile(admin_id: int, db: Session = Depends(get_db)):
    admin = db.get(Admin, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    user = db.get(User, admin.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "admin_id": admin.id,
        "department": admin.department,
        "user": UserOut.model_validate(user),
    }
