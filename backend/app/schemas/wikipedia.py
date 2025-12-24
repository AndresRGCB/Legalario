from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class WikipediaSearchRequest(BaseModel):
    """Schema para solicitar busqueda en Wikipedia."""
    search_term: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Termino a buscar en Wikipedia"
    )
    max_tokens: Optional[int] = Field(
        default=500,
        ge=50,
        le=2000,
        description="Maximo de tokens para el resumen"
    )


class WikipediaSearchResponse(BaseModel):
    """Schema de respuesta con resultado de Wikipedia y resumen."""
    id: UUID
    search_term: str
    wikipedia_url: Optional[str] = None
    extracted_text: str
    summary: str
    model_used: Optional[str] = None
    processing_time_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WikipediaHistoryResponse(BaseModel):
    """Schema para historial de busquedas Wikipedia."""
    id: UUID
    search_term: str
    wikipedia_url: Optional[str] = None
    extracted_text: str
    summary: str
    model_used: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
