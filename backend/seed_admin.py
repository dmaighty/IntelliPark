import os

from sqlalchemy import select

from app.database.connection import SessionLocal
from app.db.models.user import Admin, User
from app.security import hash_password


def seed():
    email = os.environ.get("ADMIN_EMAIL", "admin@intellipark.local").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    full_name = os.environ.get("ADMIN_NAME", "IntelliPark Admin").strip()
    department = os.environ.get("ADMIN_DEPARTMENT", "Operations").strip()

    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            if user.role != "admin":
                user.role = "admin"
            admin = db.scalar(select(Admin).where(Admin.user_id == user.id))
            if not admin:
                db.add(Admin(user_id=user.id, department=department))
            db.commit()
            print(f"Admin already exists: {email}")
            return

        user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="admin",
        )
        db.add(user)
        db.flush()
        db.add(Admin(user_id=user.id, department=department))
        db.commit()
        print(f"Created admin: {email}")
        print(f"Password: {password}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
