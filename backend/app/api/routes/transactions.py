import hashlib
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionResponse, AsyncProcessResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])


def generate_idempotency_key(user_id: str, monto: float, tipo: str) -> str:
    """Genera una clave de idempotencia basada en los datos de la transacción."""
    data = f"{user_id}:{monto}:{tipo}"
    return hashlib.sha256(data.encode()).hexdigest()[:32]


@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db)
):
    """
    Crear una nueva transacción de forma SÍNCRONA.

    - Idempotente: si ya existe una transacción con los mismos datos, retorna 409 Conflict.
    - La transacción se procesa inmediatamente (status: procesado).
    """
    # Generar clave de idempotencia
    idempotency_key = generate_idempotency_key(
        transaction_data.user_id,
        transaction_data.monto,
        transaction_data.tipo.value
    )

    # Verificar si ya existe
    existing = db.query(Transaction).filter(
        Transaction.idempotency_key == idempotency_key
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "DUPLICATE_TRANSACTION",
                "message": f"Ya existe una transacción con estos datos",
                "existing_transaction_id": str(existing.id)
            }
        )

    # Crear nueva transacción (síncrona - se procesa inmediatamente)
    new_transaction = Transaction(
        idempotency_key=idempotency_key,
        user_id=transaction_data.user_id,
        monto=transaction_data.monto,
        tipo=transaction_data.tipo,
        status=TransactionStatus.PROCESADO  # Síncrono = procesado inmediatamente
    )

    try:
        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Transacción duplicada (race condition detectada)"
        )

    return new_transaction


@router.post("/async-process", response_model=AsyncProcessResponse)
def async_process_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db)
):
    """
    Crear y procesar una transacción de forma ASÍNCRONA con Celery.

    - Guarda la transacción con status 'pendiente'.
    - Encola una tarea en Celery para procesamiento.
    - El worker simula un banco externo (sleep) y actualiza el status.
    - Notifica cambios via WebSocket.
    """
    # Importar aquí para evitar imports circulares
    from app.celery_app.tasks import process_transaction_task

    # Generar clave de idempotencia con prefijo 'async' para diferenciar
    idempotency_key = "async_" + generate_idempotency_key(
        transaction_data.user_id,
        transaction_data.monto,
        transaction_data.tipo.value
    )

    # Verificar si ya existe
    existing = db.query(Transaction).filter(
        Transaction.idempotency_key == idempotency_key
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "DUPLICATE_TRANSACTION",
                "message": f"Ya existe una transacción async con estos datos",
                "existing_transaction_id": str(existing.id)
            }
        )

    # Crear nueva transacción con status pendiente
    new_transaction = Transaction(
        idempotency_key=idempotency_key,
        user_id=transaction_data.user_id,
        monto=transaction_data.monto,
        tipo=transaction_data.tipo,
        status=TransactionStatus.PENDIENTE
    )

    try:
        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Transacción duplicada (race condition detectada)"
        )

    # Encolar tarea en Celery
    task = process_transaction_task.delay(str(new_transaction.id))

    # Actualizar con el task_id de Celery
    new_transaction.celery_task_id = task.id
    db.commit()
    db.refresh(new_transaction)

    return AsyncProcessResponse(
        transaction_id=new_transaction.id,
        task_id=task.id,
        status=TransactionStatus.PENDIENTE,
        message="Transacción encolada para procesamiento asíncrono"
    )


@router.get("/", response_model=List[TransactionResponse])
def list_transactions(
    user_id: Optional[str] = None,
    status: Optional[TransactionStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Listar transacciones con filtros opcionales.
    """
    query = db.query(Transaction)

    if user_id:
        query = query.filter(Transaction.user_id == user_id)
    if status:
        query = query.filter(Transaction.status == status)

    return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Obtener una transacción por ID.
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada"
        )

    return transaction
