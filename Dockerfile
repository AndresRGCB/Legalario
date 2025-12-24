# Multi-stage Dockerfile: Frontend build + Backend
# Ubicado en la raiz del proyecto para acceder a frontend/ y backend/

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend con Frontend incluido
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema + Chromium para Selenium
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Variables de entorno para Selenium/Chromium
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Copiar requirements e instalar dependencias Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar codigo fuente del backend
COPY backend/ .

# Copiar frontend build desde stage anterior
COPY --from=frontend-builder /frontend/dist /app/frontend_dist

# Puerto de FastAPI
EXPOSE 8000

# Comando por defecto
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
