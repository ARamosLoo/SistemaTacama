# Despliegue del backend en el VPS (Contabo) — TacamaMesa

Arquitectura: un solo VPS con Docker Compose. Caddy expone HTTPS (80/443) y reparte
a los 6 servicios; Postgres, Redis y RabbitMQ quedan en red interna (no publicos).
Los frontends siguen en Vercel y apuntan a `https://<DOMINIO>`.

> Estos archivos se probaron solo con `docker compose config` (valido). La compilacion
> de las imagenes no se pudo probar en la PC (Docker apagado): revisa el primer build.

## Requisitos
- VPS con Ubuntu 22.04/24.04, minimo 4 GB de RAM (8 GB ideal). Con 4 GB crea swap (paso 2).
- IP publica del VPS y la contrasena de root.
- Cambios de git subidos a GitHub (compose.prod, Dockerfile.prod, Caddyfile).

## 1. Entrar al VPS
Desde PowerShell o Git Bash:
```
ssh root@IP_DEL_VPS
```
(la primera vez responde `yes`; la contrasena no se ve al escribirla).

## 2. Preparar el servidor
```
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```
Si tiene 4 GB de RAM o menos, agrega swap:
```
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 3. Bajar el codigo
```
git clone https://github.com/ARamosLoo/SistemaTacama.git
cd SistemaTacama
```
Si el repo es privado, pedira usuario y, como contrasena, un token personal
(GitHub > Settings > Developer settings > Personal access tokens, permiso `repo`).

## 4. Configurar variables
```
cp .env.prod.example .env
nano .env
```
- `DOMAIN`: IP con guiones + `.sslip.io`. Ej. IP `203.0.113.7` -> `203-0-113-7.sslip.io`
  (o tu propio dominio si tiene un registro A apuntando a la IP).
- Contrasenas y secretos JWT: genera cada uno con `openssl rand -hex 32` y pegalo.
  Solo letras y numeros (van dentro de URLs).
- `CORS_ORIGINS`: los dominios exactos de Vercel (comensal y staff), sin `/` final.
Guardar: Ctrl+O, Enter, Ctrl+X.

## 5. Construir y levantar
```
COMPOSE_PARALLEL_LIMIT=2 docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```
Cada servicio crea sus tablas solo al arrancar (`prisma db push`). Si alguno queda
reiniciandose: `docker compose -f docker-compose.prod.yml logs --tail 50 <servicio>`.

## 6. Cargar datos iniciales (UNA sola vez)
```
docker compose -f docker-compose.prod.yml exec auth-service ts-node prisma/seed.ts
docker compose -f docker-compose.prod.yml exec catalogo-i18n-service ts-node prisma/seed.ts
docker compose -f docker-compose.prod.yml exec maridaje-service ts-node prisma/seed.ts
docker compose -f docker-compose.prod.yml exec inventario-service ts-node prisma/seed.ts
docker compose -f docker-compose.prod.yml exec analitica-auditoria-service ts-node prisma/seed.ts
```
(comandas tambien tiene seed; ejecutalo igual solo si necesitas sus datos de ejemplo.)
No repitas el seed del catalogo: recarga la carta desde cero.

## 7. Verificar
En el navegador: `https://<DOMINIO>/api/v1/carta` debe devolver JSON (la primera vez,
Caddy tarda ~30 s en obtener el certificado).

## 8. Conectar Vercel
En `apps/comensal-pwa/vercel.json` y `apps/staff-web/vercel.json` todos los rewrites
`/api/v1/...` pasan a apuntar a `https://<DOMINIO>/api/v1/...`. En Vercel (ambos proyectos)
define `VITE_SOCKET_URL=https://<DOMINIO>` y haz Redeploy.

## Operacion
- Actualizar: `git pull && docker compose -f docker-compose.prod.yml up -d --build`
- Logs: `docker compose -f docker-compose.prod.yml logs -f --tail 100 <servicio>`
- Reiniciar: `docker compose -f docker-compose.prod.yml restart <servicio>`
- Respaldo BD: `docker compose -f docker-compose.prod.yml exec postgres pg_dump -U tacama_user tacamamesa > respaldo.sql`

## Seguridad
- Cambia la contrasena de root que dio Contabo y usa claves SSH cuando puedas.
- Nunca subas el `.env` real a git. Postgres, Redis y RabbitMQ no tienen puertos publicados.
- Las cuentas de personal del seed tienen contrasenas de demo: cambialas desde el sistema.
