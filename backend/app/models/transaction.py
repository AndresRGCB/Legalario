import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class TransactionStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    PROCESADO = "procesado"
    FALLIDO = "fallido"


class TransactionType(str, enum.Enum):
    DEPOSITO = "deposito"
    RETIRO = "retiro"
    TRANSFERENCIA = "transferencia"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Clave de idempotencia - única para evitar duplicados
    idempotency_key = Column(String(255), unique=True, nullable=False, index=True)

    # Datos de la transacción
    user_id = Column(String(255), nullable=False, index=True)
    monto = Column(Float, nullable=False)
    tipo = Column(SQLEnum(TransactionType), nullable=False)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDIENTE, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)

    # Tracking de Celery
    celery_task_id = Column(String(255), nullable=True)
    error_message = Column(String(500), nullable=True)

    def __repr__(self):
        return f"<Transaction {self.id} - {self.user_id} - {self.monto} - {self.status}>"
