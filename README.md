# Legalario Transactions API

Sistema de transacciones con procesamiento sincrono y asincrono usando FastAPI, Celery, Redis y React.

## Requisitos

- Docker y Docker Compose

## Ejecucion con Docker (Recomendado)

### 1. Construir el frontend primero

```bash
docker-compose --profile build up frontend
```

### 2. Levantar todos los servicios

```bash
docker-compose up --build
```

Esto levanta automaticamente:
- **PostgreSQL** (puerto 5432) - Base de datos
- **Redis** (puerto 6379) - Cola de mensajes
- **FastAPI** (puerto 8000) - API + Frontend
- **Celery Worker** - Procesamiento asincrono

### 3. Acceder a la aplicacion

- **Frontend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **API Redoc:** http://localhost:8000/redoc

---

## Ejecucion Manual (Alternativa)

Si prefieres ejecutar sin Docker:

### Requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis

### 1. Crear la base de datos

```sql
CREATE DATABASE legalario_transactions;
```

### 2. Iniciar Redis con Docker

```bash
docker-compose up -d redis
```

### 3. Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
alembic upgrade head
```

### 4. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Build para produccion
npm run build
```

### 5. Ejecutar (3 terminales)

**Terminal 1: Redis**
```bash
docker-compose up redis
```

**Terminal 2: FastAPI**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 3: Celery Worker**
```bash
cd backend
venv\Scripts\activate
celery -A app.celery_app.celery_config worker --loglevel=info --pool=solo
```

---

## Endpoints

### POST /api/transactions/create
Crear transaccion sincrona (se procesa inmediatamente).

```json
{
  "user_id": "user123",
  "monto": 100.50,
  "tipo": "deposito"
}
```

Tipos disponibles: `deposito`, `retiro`, `transferencia`

### POST /api/transactions/async-process
Crear transaccion asincrona (se encola en Celery).

```json
{
  "user_id": "user123",
  "monto": 100.50,
  "tipo": "deposito"
}
```

### GET /api/transactions/
Listar transacciones con filtros opcionales.

Query params:
- `user_id`: Filtrar por usuario
- `status`: Filtrar por estado (pendiente, procesado, fallido)
- `skip`: Offset para paginacion
- `limit`: Limite de resultados

### WebSocket /api/transactions/stream
Recibir actualizaciones en tiempo real cuando cambia el estado de una transaccion.

---

## Arquitectura

```
legalario-transactions/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Configuracion
│   │   ├── database.py       # SQLAlchemy
│   │   ├── models/           # Modelos
│   │   ├── schemas/          # Pydantic
│   │   ├── api/
│   │   │   ├── routes/       # Endpoints
│   │   │   └── websocket.py  # WebSocket
│   │   └── celery_app/       # Celery
│   ├── alembic/              # Migraciones
│   └── Dockerfile
├── frontend/
│   └── src/                  # React app
├── docker-compose.yml
└── init-db.sql
```

---

## Flujo de Procesamiento

### Sincrono (/create)
```
Cliente -> POST /create -> Verificar idempotencia -> Guardar (procesado) -> Respuesta
```

### Asincrono (/async-process)
```
Cliente -> POST /async-process -> Guardar (pendiente) -> Encolar Celery -> Respuesta
                                                              |
                                                              v
                                                      [Celery Worker]
                                                              |
                                                         Sleep 2-5s
                                                              |
                                                    Actualizar status
                                                              |
                                                     WebSocket broadcast
                                                              |
                                                              v
                                                   Frontend actualiza UI
```

---

## Comandos Docker utiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio especifico
docker-compose logs -f backend
docker-compose logs -f celery

# Reiniciar un servicio
docker-compose restart backend

# Parar todo
docker-compose down

# Parar y eliminar volumenes (reset de BD)
docker-compose down -v
```
