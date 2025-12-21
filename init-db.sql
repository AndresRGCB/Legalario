-- Script de inicializacion de la base de datos
-- Este script se ejecuta automaticamente cuando PostgreSQL inicia por primera vez

-- La base de datos legalario_transactions ya se crea via POSTGRES_DB en docker-compose
-- Este script es para configuraciones adicionales si se necesitan

-- Crear extension para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mensaje de confirmacion (visible en logs de Docker)
DO $$
BEGIN
    RAISE NOTICE 'Base de datos legalario_transactions inicializada correctamente';
END $$;
