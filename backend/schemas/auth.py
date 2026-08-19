from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: str  # Now a string UUID (platform sub)
    email: str
    name: Optional[str] = None
    role: str = "user"  # user/admin
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlatformTokenExchangeRequest(BaseModel):
    """Request body for exchanging Platform token for app token."""

    platform_token: str


class TokenExchangeResponse(BaseModel):
    """Response body for issued application token."""

    token: str


class RegisterRequest(BaseModel):
    """Request body for email/password registration."""

    email: EmailStr
    password: str = Field(min_length=8)
    name: Optional[str] = None


class LoginRequest(BaseModel):
    """Request body for email/password login."""

    email: EmailStr
    password: str


class AuthTokenResponse(BaseModel):
    """Response body for local register/login: token + the user it belongs to."""

    token: str
    user: UserResponse
