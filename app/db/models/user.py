from typing import Optional
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # driver / admin
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    driver = relationship("Driver", back_populates="user", uselist=False)
    admin = relationship("Admin", back_populates="user", uselist=False)


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    phone: Mapped[Optional[str]]= mapped_column(String(20), nullable=True)

    user = relationship("User", back_populates="driver")


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    user = relationship("User", back_populates="admin")