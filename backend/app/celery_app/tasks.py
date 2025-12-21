import time
import random
from datetime import datetime

from app.celery_app.celery_config import celery_app
from app.database import SessionLocal
from app.models.transaction import Transaction, TransactionStatus


@celery_app.task(bind=True, max_retries=3)
def process_transaction_task(self, transaction_id: str):
    """
    Procesa una transacción de forma asíncrona.

    - Simula procesamiento con un banco externo (sleep 2-5 segundos).
    - Verifica duplicados y actualiza el status.
    - Notifica via WebSocket cuando cambia el status.
    """
    db = SessionLocal()

    try:
        # Obtener la transacción
        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id
        ).first()

        if not transaction:
            return {
                "error": "Transaction not found",
                "transaction_id": transaction_id
            }

        # Verificar idempotencia en el worker
        # Si ya está procesada o fallida, no reprocesar
        if transaction.status in [TransactionStatus.PROCESADO, TransactionStatus.FALLIDO]:
            return {
                "status": "already_processed",
                "transaction_id": transaction_id,
                "current_status": transaction.status.value
            }

        # Simular procesamiento con banco externo (2-5 segundos)
        processing_time = random.uniform(2, 5)
        time.sleep(processing_time)

        # Verificar si hay duplicados (mismos datos pero diferente ID)
        # Buscar transacciones con mismo user_id, monto, tipo que ya estén procesadas
        base_key = transaction.idempotency_key.replace("async_", "")
        duplicate = db.query(Transaction).filter(
            Transaction.id != transaction.id,
            Transaction.status == TransactionStatus.PROCESADO,
            Transaction.idempotency_key.in_([base_key, f"async_{base_key}"])
        ).first()

        if duplicate:
            # Si hay duplicado procesado, marcar como fallido
            transaction.status = TransactionStatus.FALLIDO
            transaction.error_message = f"Transacción duplicada. Original: {duplicate.id}"
        else:
            # Simular éxito/fallo aleatorio (90% éxito, 10% fallo para demo)
            success = random.random() < 0.9

            if success:
                transaction.status = TransactionStatus.PROCESADO
                transaction.processed_at = datetime.utcnow()
            else:
                transaction.status = TransactionStatus.FALLIDO
                transaction.error_message = "Error simulado en procesamiento del banco"

        transaction.updated_at = datetime.utcnow()
        db.commit()

        # Notificar via WebSocket
        try:
            from app.api.websocket import broadcast_transaction_update
            broadcast_transaction_update(transaction)
        except Exception as e:
            # Si falla el WebSocket, no es crítico
            print(f"Error broadcasting WebSocket: {e}")

        return {
            "status": "completed",
            "transaction_id": transaction_id,
            "final_status": transaction.status.value,
            "processing_time": processing_time
        }

    except Exception as e:
        db.rollback()
        # Reintentar si hay error
        raise self.retry(exc=e, countdown=5)
    finally:
        db.close()
