from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserLogin(BaseModel):
    """Schema para login."""
    email: str = Field(..., description="Usuario")
    password: str = Field(..., description="Password")


class UserResponse(BaseModel):
    """Schema de respuesta para usuario."""
    id: UUID
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema de respuesta para token JWT."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Data extraida del token JWT."""
    user_id: Optional[str] = None
    email: Optional[str] = None
