# Dockerfile para Backend FastAPI + Celery
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar codigo fuente
COPY . .

# Copiar frontend build (se copia desde el build de frontend)
# El frontend se construye en el docker-compose

# Puerto de FastAPI
EXPOSE 8000

# Comando por defecto (se sobreescribe en docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
