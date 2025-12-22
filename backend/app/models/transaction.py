import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM

from app.database import Base


class TransactionStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    PROCESADO = "procesado"
    FALLIDO = "fallido"


class TransactionType(str, enum.Enum):
    DEPOSITO = "deposito"
    RETIRO = "retiro"
    TRANSFERENCIA = "transferencia"


# Definir los tipos ENUM de PostgreSQL que se usan (sin crearlos automáticamente)
transaction_type_enum = PG_ENUM(
    'deposito', 'retiro', 'transferencia',
    name='transactiontype',
    create_type=False
)

transaction_status_enum = PG_ENUM(
    'pendiente', 'procesado', 'fallido',
    name='transactionstatus',
    create_type=False
)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Clave de idempotencia - única para evitar duplicados
    idempotency_key = Column(String(255), unique=True, nullable=False, index=True)

    # Datos de la transacción
    user_id = Column(String(255), nullable=False, index=True)
    monto = Column(Float, nullable=False)
    tipo = Column(transaction_type_enum, nullable=False)
    status = Column(transaction_status_enum, nullable=False, server_default='pendiente')

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)

    # Tracking de Celery
    celery_task_id = Column(String(255), nullable=True)
    error_message = Column(String(500), nullable=True)

    def __repr__(self):
        return f"<Transaction {self.id} - {self.user_id} - {self.monto} - {self.status}>"
