# Legalario Transactions API

Sistema de transacciones con procesamiento sincrono y asincrono usando FastAPI, Celery, Redis y React.

## Requisitos

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Docker (para Redis)

## Setup

### 1. Crear la base de datos

```sql
CREATE DATABASE legalario_transactions;
```

### 2. Iniciar Redis con Docker

```bash
cd legalario-transactions
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

## Ejecutar

Necesitas 3 terminales:

### Terminal 1: Redis (si no esta corriendo)
```bash
docker-compose up redis
```

### Terminal 2: FastAPI
```bash
cd backend
venv\Scripts\activate  # o source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 3: Celery Worker
```bash
cd backend
venv\Scripts\activate  # o source venv/bin/activate
celery -A app.celery_app.celery_config worker --loglevel=info --pool=solo
```

### Acceder a la aplicacion

- **Frontend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **API Redoc:** http://localhost:8000/redoc

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
│   └── alembic/              # Migraciones
├── frontend/
│   └── src/                  # React app
└── docker-compose.yml        # Redis
```

## Flujo de Procesamiento

### Sincrono (/create)
1. Recibe peticion
2. Verifica idempotencia
3. Guarda en BD con status "procesado"
4. Retorna transaccion

### Asincrono (/async-process)
1. Recibe peticion
2. Guarda en BD con status "pendiente"
3. Encola tarea en Celery
4. Worker procesa (simula banco con sleep 2-5s)
5. Actualiza status a "procesado" o "fallido"
6. Notifica via WebSocket
