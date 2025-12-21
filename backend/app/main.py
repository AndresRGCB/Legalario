from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import transactions_router
from app.api.websocket import manager

app = FastAPI(
    title="Legalario Transactions API",
    description="API para gestión de transacciones con procesamiento síncrono y asíncrono",
    version="1.0.0"
)

# CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router de transacciones
app.include_router(transactions_router, prefix="/api")


# Health check
@app.get("/api/health")
def health_check():
    """Endpoint de salud para verificar que la API está funcionando."""
    return {"status": "healthy", "service": "legalario-transactions"}


# WebSocket endpoint para streaming de transacciones
@app.websocket("/api/transactions/stream")
async def websocket_endpoint(websocket: WebSocket, user_id: str = None):
    """
    WebSocket para recibir actualizaciones de transacciones en tiempo real.

    Query param opcional: user_id - para filtrar solo transacciones del usuario.
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Mantener conexión viva, esperar mensajes del cliente
            data = await websocket.receive_text()
            # Responder a ping con pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# Servir frontend React (archivos estáticos)
# Buscar en multiples ubicaciones (local y Docker)
FRONTEND_PATHS = [
    Path(__file__).parent.parent / "frontend_dist",  # Docker: /app/frontend_dist
    Path(__file__).parent.parent.parent / "frontend" / "dist",  # Local: ../frontend/dist
]

FRONTEND_DIR = None
for path in FRONTEND_PATHS:
    if path.exists():
        FRONTEND_DIR = path
        break

if FRONTEND_DIR and (FRONTEND_DIR / "assets").exists():
    # Montar archivos estáticos (JS, CSS, imágenes)
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")


# Catch-all para SPA routing - debe ir al final
@app.get("/{path:path}")
async def serve_frontend(path: str):
    """
    Sirve el frontend React.
    Para rutas que no son API, retorna index.html (SPA routing).
    """
    if not FRONTEND_DIR or not FRONTEND_DIR.exists():
        return {"message": "Frontend not built. Run 'docker-compose --profile build up frontend' or 'npm run build' in frontend directory."}

    file_path = FRONTEND_DIR / path

    # Si el archivo existe, servirlo
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    # Si no, servir index.html para que React Router maneje la ruta
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    return {"message": "Frontend not found"}
