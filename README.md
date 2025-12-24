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
- **FastAPI + React Frontend** (puerto 8000) - API y Frontend integrados
- **Celery Worker** - Procesamiento asincrono

El frontend de React se construye automaticamente dentro del Dockerfile (multi-stage build) y se sirve desde FastAPI.

### 4. Acceder a la aplicacion

- **Aplicacion:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

**Usuario de prueba:** `user` / `password`

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

