from pathlib import Path
from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import transactions_router, auth_router
from app.api.websocket import manager, redis_subscriber
from app.seed import create_default_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager - ejecuta seed y suscriptor Redis al iniciar."""
    # Startup: crear usuario por defecto
    create_default_user()

    # Iniciar suscriptor de Redis en background
    subscriber_task = asyncio.create_task(redis_subscriber())
    print("Suscriptor Redis iniciado como background task")

    yield

    # Shutdown: cancelar el suscriptor
    subscriber_task.cancel()
    try:
        await subscriber_task
    except asyncio.CancelledError:
        print("Suscriptor Redis detenido")


app = FastAPI(
    title="Legalario Transactions API",
    description="API para gestión de transacciones con procesamiento síncrono y asíncrono",
    version="1.0.0",
    lifespan=lifespan
)

# CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")


# Health check
@app.get("/api/health")
def health_check():
    """Endpoint de salud para verificar que la API está funcionando."""
    return {"status": "healthy", "service": "legalario-transactions"}


# WebSocket endpoint para streaming de transacciones
@app.websocket("/api/transactions/stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket para recibir actualizaciones de transacciones en tiempo real.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Mantener conexión viva, esperar mensajes del cliente
            data = await websocket.receive_text()
            # Responder a ping con pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error en WebSocket: {e}")
        manager.disconnect(websocket)


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
