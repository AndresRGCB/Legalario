import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class WikipediaLog(Base):
    """Modelo para registrar busquedas de Wikipedia con resumen IA."""
    __tablename__ = "wikipedia_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    search_term = Column(String(500), nullable=False)
    wikipedia_url = Column(String(1000), nullable=True)
    extracted_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
