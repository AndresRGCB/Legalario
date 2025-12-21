from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio

from app.models.transaction import Transaction


class ConnectionManager:
    """Gestor de conexiones WebSocket."""

    def __init__(self):
        # Conexiones activas por user_id
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Conexiones globales (sin filtro de usuario)
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: str = None):
        """Acepta una nueva conexión WebSocket."""
        await websocket.accept()
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        else:
            self.global_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        """Desconecta un WebSocket."""
        if user_id and user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        elif websocket in self.global_connections:
            self.global_connections.remove(websocket)

    async def send_to_user(self, user_id: str, message: dict):
        """Envía mensaje a un usuario específico."""
        if user_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)

            # Limpiar conexiones muertas
            for conn in dead_connections:
                self.active_connections[user_id].remove(conn)

    async def broadcast(self, message: dict):
        """Broadcast a todas las conexiones globales."""
        dead_connections = []
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)

        # Limpiar conexiones muertas
        for conn in dead_connections:
            self.global_connections.remove(conn)

    async def broadcast_to_all(self, message: dict):
        """Broadcast a TODAS las conexiones (usuarios y globales)."""
        await self.broadcast(message)
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, message)


# Instancia global del manager
manager = ConnectionManager()


def broadcast_transaction_update(transaction: Transaction):
    """
    Wrapper síncrono para broadcast desde Celery.
    Crea un evento asíncrono para enviar la actualización.
    """
    message = {
        "type": "STATUS_CHANGE",
        "data": {
            "id": str(transaction.id),
            "user_id": transaction.user_id,
            "status": transaction.status.value,
            "monto": transaction.monto,
            "tipo": transaction.tipo.value,
            "updated_at": transaction.updated_at.isoformat() if transaction.updated_at else None,
            "processed_at": transaction.processed_at.isoformat() if transaction.processed_at else None,
            "error_message": transaction.error_message
        }
    }

    try:
        # Intentar obtener el event loop existente
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Si el loop está corriendo, crear una task
            asyncio.ensure_future(_async_broadcast(message, transaction.user_id))
        else:
            # Si no hay loop corriendo, ejecutar directamente
            loop.run_until_complete(_async_broadcast(message, transaction.user_id))
    except RuntimeError:
        # Si no hay event loop, crear uno nuevo
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_async_broadcast(message, transaction.user_id))
        finally:
            loop.close()


async def _async_broadcast(message: dict, user_id: str):
    """Helper asíncrono para hacer el broadcast."""
    await manager.send_to_user(user_id, message)
    await manager.broadcast(message)
