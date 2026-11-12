#!/usr/bin/env bash
# ==============================================================================
# prod-init.sh — Inicialización de Base de Datos y Datos Semilla en Producción
# Se ejecuta en el VPS (como usuario deploy) una sola vez al configurar el sistema
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "============================================================"
echo " TacamaMesa — Inicialización de Producción"
echo "============================================================"

# 1. Verificar archivo .env
if [ ! -f ".env" ]; then
  echo "❌ ERROR: No se encontró el archivo .env en la raíz."
  echo "   Copia .env.production.example a .env y define tus secretos primero."
  exit 1
fi

# Cargar variables del .env
set -a
source .env
set +a

# 2. Esperar a que Postgres esté disponible en la red interna
echo "⏳ 1/4 Esperando a que PostgreSQL esté listo..."
POSTGRES_READY=false
for i in {1..30}; do
  if docker exec tacama-postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
    POSTGRES_READY=true
    break
  fi
  sleep 2
done

if [ "$POSTGRES_READY" != "true" ]; then
  echo "❌ ERROR: PostgreSQL no respondió tras 60 segundos."
  echo "   Revisa los logs con: docker compose -f docker-compose.prod.yml logs postgres"
  exit 1
fi
echo "✅ PostgreSQL listo."

# 3. Asegurar que los schemas existan (init.sql)
echo "⏳ 2/4 Verificando esquemas PostgreSQL..."
docker exec -i tacama-postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < infra/postgres/init.sql >/dev/null 2>&1 || true
echo "✅ Esquemas listos (auth, catalogo, maridaje, comandas, inventario, analitica)."

# 4. Crear tablas con Prisma y ejecutar seeds mediante contenedor efímero
echo "⏳ 3/4 Creando tablas de Prisma en cada microservicio..."

docker run --rm \
  --network tacama-net \
  -v "$DIR":/app \
  -w /app \
  --env-file .env \
  node:20-alpine sh -c "
    set -e
    apk add --no-cache libc6-compat openssl >/dev/null 2>&1
    npm install -g pnpm@8.15.4 >/dev/null 2>&1
    pnpm install --frozen-lockfile >/dev/null 2>&1

    echo '   Compilando paquetes compartidos...'
    pnpm --filter '@tacamamesa/shared-*' build >/dev/null 2>&1

    SERVICIOS='auth-service catalogo-i18n-service maridaje-service comandas-service inventario-service analitica-auditoria-service'
    for s in \$SERVICIOS; do
      echo \"   Sincronizando tablas de \$s...\"
      pnpm --filter \"@tacamamesa/\$s\" exec prisma generate >/dev/null 2>&1
      pnpm --filter \"@tacamamesa/\$s\" exec prisma db push --skip-generate --accept-data-loss
    done

    echo '⏳ 4/4 Cargando datos semilla iniciales...'
    echo '   Cargando usuarios y mesas (auth)...'
    pnpm --filter '@tacamamesa/auth-service' exec ts-node prisma/seed.ts
    echo '   Cargando carta y traducciones (catalogo)...'
    pnpm --filter '@tacamamesa/catalogo-i18n-service' exec ts-node prisma/seed.ts
    echo '   Cargando maridajes y etiquetas (maridaje)...'
    pnpm --filter '@tacamamesa/maridaje-service' exec ts-node prisma/seed.ts
    echo '   Cargando inventario inicial de bodega (inventario)...'
    pnpm --filter '@tacamamesa/inventario-service' exec ts-node prisma/seed.ts
    echo '   Cargando log inicial de auditoría (analitica)...'
    pnpm --filter '@tacamamesa/analitica-auditoria-service' exec ts-node prisma/seed.ts
  "

# 5. Comprobación final de registros
echo ""
echo "============================================================"
echo " Comprobación de datos en PostgreSQL:"
echo "============================================================"
docker exec tacama-postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "
  SELECT 'auth.usuarios' AS tabla, count(*) AS registros FROM auth.usuarios
  UNION ALL
  SELECT 'auth.mesas', count(*) FROM auth.mesas
  UNION ALL
  SELECT 'catalogo.platos', count(*) FROM catalogo.platos
  UNION ALL
  SELECT 'maridaje.etiquetas', count(*) FROM maridaje.etiquetas
  UNION ALL
  SELECT 'inventario.etiquetas', count(*) FROM inventario.etiquetas
  UNION ALL
  SELECT 'analitica.log_auditoria', count(*) FROM analitica.log_auditoria;
"

echo "============================================================"
echo " 🎉 Base de datos inicializada correctamente para Producción"
echo "============================================================"

