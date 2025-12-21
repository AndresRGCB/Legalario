from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.transaction import TransactionStatus, TransactionType


class TransactionCreate(BaseModel):
    """Schema para crear una transacción."""
    user_id: str = Field(..., min_length=1, description="ID del usuario")
    monto: float = Field(..., gt=0, description="Monto de la transacción (debe ser positivo)")
    tipo: TransactionType = Field(..., description="Tipo de transacción")


class TransactionResponse(BaseModel):
    """Schema de respuesta para una transacción."""
    id: UUID
    idempotency_key: str
    user_id: str
    monto: float
    tipo: TransactionType
    status: TransactionStatus
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None
    celery_task_id: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class AsyncProcessResponse(BaseModel):
    """Schema de respuesta para procesamiento asíncrono."""
    transaction_id: UUID
    task_id: str
    status: TransactionStatus
    message: str
