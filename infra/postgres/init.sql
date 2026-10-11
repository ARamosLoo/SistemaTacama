-- =============================================================
-- init.sql — Inicialización de schemas PostgreSQL
-- Se ejecuta automáticamente al primer arranque del contenedor
-- Un schema por microservicio (sin tablas compartidas)
-- =============================================================

-- Crear schemas para cada microservicio
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS catalogo;
CREATE SCHEMA IF NOT EXISTS maridaje;
CREATE SCHEMA IF NOT EXISTS comandas;
CREATE SCHEMA IF NOT EXISTS inventario;
CREATE SCHEMA IF NOT EXISTS analitica;

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- búsqueda fuzzy de platos

-- Comentarios de documentación
COMMENT ON SCHEMA auth IS 'Usuarios, roles y tokens de autenticación';
COMMENT ON SCHEMA catalogo IS 'Carta, platos, ingredientes, alérgenos y traducciones';
COMMENT ON SCHEMA maridaje IS 'Reglas y recomendaciones de maridaje';
COMMENT ON SCHEMA comandas IS 'Comandas, detalles, mesas y valoraciones';
COMMENT ON SCHEMA inventario IS 'Etiquetas, existencias, lotes y movimientos de stock';
COMMENT ON SCHEMA analitica IS 'Indicadores, logs de auditoría y métricas';
