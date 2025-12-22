from fastapi import WebSocket
from typing import List
import json
import asyncio
import sys
import redis.asyncio as aioredis

from app.config import settings


def log(msg):
    """Log con flush inmediato."""
    print(msg, flush=True)
    sys.stdout.flush()


class ConnectionManager:
    """Gestor de conexiones WebSocket."""

    def __init__(self):
        # Conexiones globales
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Acepta una nueva conexión WebSocket."""
        await websocket.accept()
        self.active_connections.append(websocket)
        log(f"[WS] Conectado. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Desconecta un WebSocket."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        log(f"[WS] Desconectado. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast a todas las conexiones."""
        log(f"[WS] Broadcasting a {len(self.active_connections)} conexiones")
        if not self.active_connections:
            log("[WS] No hay conexiones activas")
            return

        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
                log(f"[WS] Mensaje enviado: {message.get('type')}")
            except Exception as e:
                log(f"[WS] Error enviando: {e}")
                dead_connections.append(connection)

        # Limpiar conexiones muertas
        for conn in dead_connections:
            if conn in self.active_connections:
                self.active_connections.remove(conn)


# Instancia global del manager
manager = ConnectionManager()

# Canal de Redis para pub/sub
REDIS_CHANNEL = "transaction_updates"


def publish_transaction_update(transaction):
    """
    Publica actualización de transacción en Redis (llamado desde Celery).
    Usa redis síncrono porque Celery es síncrono.
    """
    import redis

    # Manejar status y tipo como string o Enum
    status_val = transaction.status.value if hasattr(transaction.status, 'value') else transaction.status
    tipo_val = transaction.tipo.value if hasattr(transaction.tipo, 'value') else transaction.tipo

    message = {
        "type": "STATUS_CHANGE",
        "data": {
            "id": str(transaction.id),
            "user_id": transaction.user_id,
            "status": status_val,
            "monto": transaction.monto,
            "tipo": tipo_val,
            "updated_at": transaction.updated_at.isoformat() if transaction.updated_at else None,
            "processed_at": transaction.processed_at.isoformat() if transaction.processed_at else None,
            "error_message": transaction.error_message
        }
    }

    try:
        r = redis.from_url(settings.REDIS_URL)
        result = r.publish(REDIS_CHANNEL, json.dumps(message))
        log(f"[REDIS] Publicado: {message['data']['id']} -> {status_val} (subs: {result})")
    except Exception as e:
        log(f"[REDIS] Error publicando: {e}")


async def redis_subscriber():
    """
    Suscriptor de Redis que escucha actualizaciones y las envía por WebSocket.
    Se ejecuta como background task en FastAPI.
    """
    log(f"[REDIS-SUB] Iniciando suscriptor en canal: {REDIS_CHANNEL}")

    while True:
        try:
            r = aioredis.from_url(settings.REDIS_URL)
            pubsub = r.pubsub()
            await pubsub.subscribe(REDIS_CHANNEL)

            log("[REDIS-SUB] Suscrito, esperando mensajes...")

            async for message in pubsub.listen():
                log(f"[REDIS-SUB] Mensaje raw: type={message.get('type')}")
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        log(f"[REDIS-SUB] Recibido: {data.get('type')} - {data.get('data', {}).get('id', 'N/A')}")
                        await manager.broadcast(data)
                    except json.JSONDecodeError as e:
                        log(f"[REDIS-SUB] Error JSON: {e}")
                    except Exception as e:
                        log(f"[REDIS-SUB] Error procesando: {e}")
        except Exception as e:
            log(f"[REDIS-SUB] Error conexión: {e}")
            await asyncio.sleep(5)
            log("[REDIS-SUB] Reintentando conexión...")
