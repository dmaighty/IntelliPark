from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime
    phone: str | None = None
    profile_image_url: str | None = None


class UserRegisterIn(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=20)
    mobile: str = Field(..., min_length=10, max_length=20)


class LoginIn(BaseModel):
    identifier: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdateIn(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    profile_image_url: str | None = None


class PasswordResetEmailResponse(BaseModel):
    message: str
    email: str
    dev_reset_link: str | None = None


class PasswordResetSmsSendResponse(BaseModel):
    message: str
    phone: str
    dev_code: str | None = None


class PasswordResetSmsConfirmIn(BaseModel):
    code: str = Field(..., min_length=4, max_length=8)
    new_password: str = Field(..., min_length=8, max_length=20)


class PasswordResetTokenConfirmIn(BaseModel):
    token: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8, max_length=20)


class PasswordResetConfirmResponse(BaseModel):
    message: str


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    phone: str | None
