from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class SummarizeRequest(BaseModel):
    """Schema para solicitar un resumen."""
    text: str = Field(
        ...,
        min_length=10,
        max_length=50000,
        description="Texto a resumir (minimo 10 caracteres, maximo 50000)"
    )
    max_tokens: Optional[int] = Field(
        default=500,
        ge=50,
        le=2000,
        description="Maximo de tokens para el resumen"
    )


class SummarizeResponse(BaseModel):
    """Schema de respuesta con el resumen."""
    id: UUID
    original_text: str
    summary: str
    model_used: str
    tokens_input: Optional[int] = None
    tokens_output: Optional[int] = None
    processing_time_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AssistantLogResponse(BaseModel):
    """Schema para historial de resumenes."""
    id: UUID
    summary: str
    original_text_preview: str
    model_used: str
    created_at: datetime

    class Config:
        from_attributes = True


class AssistantLogDetailResponse(BaseModel):
    """Schema para historial con texto original completo (para vista expandida)."""
    id: UUID
    summary: str
    original_text_preview: str
    original_text: str  # Texto completo para vista expandida
    model_used: str
    created_at: datetime

    class Config:
        from_attributes = True
