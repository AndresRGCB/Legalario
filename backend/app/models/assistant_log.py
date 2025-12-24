import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AssistantLog(Base):
    __tablename__ = "assistant_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    original_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=False, default="claude-sonnet-4-20250514")
    tokens_input = Column(Integer, nullable=True)
    tokens_output = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<AssistantLog {self.id}>"
