# Legalario Transactions - Prueba Tecnica Fullstack

Sistema completo de transacciones con procesamiento sincrono/asincrono, integracion con Claude AI y automatizacion RPA.

## Video Explicativo

[Ver video explicativo del proyecto](https://drive.google.com/file/d/1VMDEvU8i8G1PFpGvawHZq_Xdi-ylmSvS/view?usp=sharing)

## Coleccion Postman

La coleccion de Postman con todos los endpoints se encuentra en la carpeta `postman/`.

---

## Inicio Rapido

### Requisitos
- Docker y Docker Compose
- API Key de Anthropic (Claude)

### 1. Clonar el repositorio

```bash
git clone https://github.com/AndresRGCB/Legalario.git
cd Legalario
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env y agregar tu API key de Anthropic
# ANTHROPIC_API_KEY=sk-ant-api03-tu-api-key-aqui
```

> **Nota:** El archivo `.env.example` contiene valores de ejemplo. Debes reemplazar `ANTHROPIC_API_KEY` con tu propia API key de Anthropic para que funcionen las features de IA.

### 3. Ejecutar con Docker

```bash
docker-compose up --build
```

Esto levanta automaticamente:
- **PostgreSQL** (puerto 5432) - Base de datos
- **Redis** (puerto 6379) - Cola de mensajes y Pub/Sub
- **FastAPI** (puerto 8000) - API + Frontend
- **Celery Worker** - Procesamiento asincrono

### 4. Acceder a la aplicacion

- **Aplicacion:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Credenciales de prueba

```
Email: test@example.com
Password: password123
```

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python 3.11) |
| Base de Datos | PostgreSQL 15 |
| Cache/Queue | Redis 7 |
| Worker | Celery |
| RPA | Selenium + Chromium |
| IA | Claude API (Anthropic) |
| Contenedores | Docker + Docker Compose |
| Migraciones | Alembic |
| Auth | JWT + bcrypt |

---

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   FastAPI   │────▶│  PostgreSQL │
│  Frontend   │◀────│   Backend   │     │     BD      │
└─────────────┘     └──────┬──────┘     └─────────────┘
       │                   │
       │ WebSocket         │ Celery Tasks
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Browser   │     │    Redis    │
│  Real-time  │     │ Queue/PubSub│
└─────────────┘     └─────────────┘
```

---

## Endpoints API

### Autenticacion
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesion |
| GET | `/api/auth/me` | Obtener usuario actual |

### Transacciones
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/transactions/create` | Crear transaccion sincrona |
| POST | `/api/transactions/async-process` | Crear transaccion asincrona (Celery) |
| GET | `/api/transactions/` | Listar transacciones |
| WS | `/api/transactions/stream` | WebSocket para actualizaciones |

### Asistente IA (Claude)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/assistant/summarize` | Generar resumen con IA |
| GET | `/api/assistant/history` | Historial de resumenes |

### Wikipedia RPA
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/wikipedia/search` | Buscar en Wikipedia + resumen IA |
| GET | `/api/wikipedia/history` | Historial de busquedas |

### Utilidades
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## Estructura del Proyecto

```
legalario-transactions/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Endpoints
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Claude client, Wikipedia scraper
│   │   ├── celery_app/          # Celery config y tasks
│   │   └── main.py              # FastAPI app
│   ├── alembic/versions/        # Migraciones de BD
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks (useWebSocket, useTransactions)
│   │   └── services/api.js      # API client
│   └── package.json
├── postman/                     # Coleccion Postman
├── docker-compose.yml
├── Dockerfile
├── .env.example                 # Variables de entorno (ejemplo)
└── README.md
```

---

## Comandos Docker Utiles

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

---

## Desarrollo Local (sin Docker)

### Requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Celery Worker

```bash
cd backend
celery -A app.celery_app.celery_config worker --loglevel=info --pool=solo
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Autor

Andres Garcia - Prueba Tecnica Fullstack para Legalario
