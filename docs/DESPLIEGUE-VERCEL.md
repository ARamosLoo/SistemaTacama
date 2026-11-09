# Guía de despliegue: TacamaMesa en Vercel (+ backend externo)

## 0. Lo primero que debes saber

TacamaMesa NO cabe entero en Vercel:

| Parte | ¿Va en Vercel? | Por qué |
|---|---|---|
| `apps/comensal-pwa` (Vite/React) | ✅ Sí | Sitio estático |
| `apps/staff-web` (Vite/React) | ✅ Sí | Sitio estático |
| 6 microservicios NestJS (`services/*`) | ❌ No | Son procesos permanentes; Vercel es serverless |
| Socket.IO (WebSocket en comandas, `/cocina`) | ❌ No | Vercel no mantiene WebSockets |
| PostgreSQL / Redis / RabbitMQ | ❌ No | Son servidores de datos |

**Arquitectura de producción propuesta**

- Vercel: los 2 frontends (2 proyectos Vercel distintos).
- Railway (o Render / Fly.io): los 6 servicios NestJS + PostgreSQL + Redis.
- CloudAMQP (plan gratis "Little Lemur"): RabbitMQ.

---

## 1. Preparar el repositorio

1. Sube el proyecto a GitHub (haz commit tú mismo cuando quieras; no lo he hecho).
2. Hay una carpeta duplicada `SistemaTacama/` sin versionar dentro del repo. Bórrala o ignórala: no debe subirse.
3. Comprueba que `.env` NO está en git (`.gitignore` ya lo cubre).

## 2. Backend (hacerlo ANTES del frontend, necesitas sus URLs)

### 2.1 Bases de datos
1. En Railway crea un proyecto → **Add PostgreSQL** y **Add Redis**.
2. En CloudAMQP crea una instancia gratis y copia la `AMQP URL`.
3. Postgres: el sistema usa **una sola base con 6 schemas** (`?schema=auth`, `catalogo`, `maridaje`, `comandas`, `inventario`, `analitica`). Ejecuta una vez el contenido de `infra/postgres/init.sql` en la base de Railway (con `psql` o el panel "Query") para crear los schemas.

### 2.2 Un servicio por microservicio
En Railway, **New → GitHub Repo** seis veces (mismo repo), cada uno con su carpeta:

| Servicio | Carpeta | PORT |
|---|---|---|
| auth | `services/auth-service` | 3001 |
| catalogo | `services/catalogo-i18n-service` | 3002 |
| maridaje | `services/maridaje-service` | 3003 |
| comandas | `services/comandas-service` | 3004 |
| inventario | `services/inventario-service` | 3005 |
| analitica | `services/analitica-auditoria-service` | 3006 |

Ojo: los servicios dependen de `packages/shared-*` (workspace pnpm). Usa el repo completo como contexto (no solo la subcarpeta) y compila los paquetes compartidos antes, por ejemplo:

- Build: `pnpm install --frozen-lockfile && pnpm --filter "@tacamamesa/shared-*" build && pnpm --filter <nombre-del-servicio> exec prisma generate && pnpm --filter <nombre-del-servicio> build`
- Start: `pnpm --filter <nombre-del-servicio> exec prisma db push --skip-generate && node services/<carpeta>/dist/main`

(No hay carpeta `prisma/migrations`, por eso se usa `db push`, igual que `scripts/dev-local.ps1`. Los `Dockerfile` por servicio asumen contexto = carpeta del servicio, y eso falla con los paquetes compartidos; por eso recomiendo comandos propios. No lo he probado en Railway: revisa el primer build.)

Datos iniciales: ejecuta una vez `pnpm --filter <servicio> db:seed` (consola de Railway) en cada servicio que tenga `prisma/seed.ts`.

### 2.3 Variables de entorno (en cada servicio)

Comunes: `NODE_ENV=production`, `PORT`, `DATABASE_URL` (la de Postgres + `?schema=<el del servicio>`), `JWT_SECRET`, `JWT_MESA_SECRET`, `JWT_EXPIRES_IN=8h`, `JWT_MESA_EXPIRES_IN=4h`, `CORS_ORIGINS`.

- **Genera secretos nuevos y largos** para JWT (nada de los del `.env.example`).
- `CORS_ORIGINS` = dominios de Vercel separados por coma, p. ej. `https://tacama-comensal.vercel.app,https://tacama-staff.vercel.app`.
- `RABBITMQ_URL`: comandas, inventario, analitica.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: catalogo y maridaje.
- Inventario: `BODEGA_SANDBOX_URL`, `BODEGA_SANDBOX_API_KEY` (el WireMock del compose no existe en producción; apunta a un servicio real o déjalo simulado).
- Analitica: `ANALITICA_SERVICE_URL` donde otro servicio la llame.

En cada servicio genera un dominio público (Settings → Networking → Generate Domain). Anota las 6 URLs.

Verifica: `https://<url-auth>/api/v1/...` y `https://<url-comandas>/api/docs` (Swagger).

## 3. Cambios de código necesarios en el frontend

Los frontends llaman a `/api/v1/...` y `io('/cocina')` **en el mismo origen**, y en desarrollo Vite lo redirige con `vite.config.ts`. En Vercel eso no existe, así que:

### 3.1 API: rewrites en `vercel.json`
Crea `apps/comensal-pwa/vercel.json` y `apps/staff-web/vercel.json` (mismo contenido; sustituye las URLs):

```json
{
  "rewrites": [
    { "source": "/api/v1/auth/:p*", "destination": "https://AUTH.up.railway.app/api/v1/auth/:p*" },
    { "source": "/api/v1/mesas/:p*", "destination": "https://AUTH.up.railway.app/api/v1/mesas/:p*" },
    { "source": "/api/v1/carta/:p*", "destination": "https://CATALOGO.up.railway.app/api/v1/carta/:p*" },
    { "source": "/api/v1/platos/:p*", "destination": "https://CATALOGO.up.railway.app/api/v1/platos/:p*" },
    { "source": "/api/v1/admin/:p*", "destination": "https://CATALOGO.up.railway.app/api/v1/admin/:p*" },
    { "source": "/api/v1/uploads/:p*", "destination": "https://CATALOGO.up.railway.app/api/v1/uploads/:p*" },
    { "source": "/api/v1/maridajes/:p*", "destination": "https://MARIDAJE.up.railway.app/api/v1/maridajes/:p*" },
    { "source": "/api/v1/reglas-maridaje/:p*", "destination": "https://MARIDAJE.up.railway.app/api/v1/reglas-maridaje/:p*" },
    { "source": "/api/v1/etiquetas/:p*", "destination": "https://MARIDAJE.up.railway.app/api/v1/etiquetas/:p*" },
    { "source": "/api/v1/comandas/:p*", "destination": "https://COMANDAS.up.railway.app/api/v1/comandas/:p*" },
    { "source": "/api/v1/valoraciones/:p*", "destination": "https://COMANDAS.up.railway.app/api/v1/valoraciones/:p*" },
    { "source": "/api/v1/existencias/:p*", "destination": "https://INVENTARIO.up.railway.app/api/v1/existencias/:p*" },
    { "source": "/api/v1/indicadores/:p*", "destination": "https://ANALITICA.up.railway.app/api/v1/indicadores/:p*" },
    { "source": "/api/v1/auditoria/:p*", "destination": "https://ANALITICA.up.railway.app/api/v1/auditoria/:p*" },
    { "source": "/((?!api/|assets/|platos/).*)", "destination": "/index.html" }
  ]
}
```

La última regla es el fallback de SPA (para que recargar `/mesa/5` no dé 404). Si un endpoint raíz sin sub-ruta (p. ej. `/api/v1/carta`) no coincide con `:p*`, añade también la regla sin `/:p*`.

### 3.2 WebSocket: apuntar directo a comandas
Vercel NO proxea WebSockets, así que el socket debe ir directo al servicio de comandas. En 3 archivos:

- `apps/comensal-pwa/src/context/AppContext.tsx:346`
- `apps/staff-web/src/pages/CocinaKdsPage.tsx:64`
- `apps/staff-web/src/pages/MesasMozoPage.tsx:70`

cambia `io('/cocina', …)` por:

```ts
io(`${import.meta.env.VITE_SOCKET_URL ?? ''}/cocina`, { query: { … }, transports: ['websocket', 'polling'] })
```

y en Vercel define `VITE_SOCKET_URL=https://COMANDAS.up.railway.app`. (En local no definas la variable y sigue funcionando con el proxy.) El comensal ya tiene sondeo de respaldo, así que si el socket falla no se rompe.

### 3.3 Fotos de platos en staff-web
`apps/staff-web/vite.config.ts` redirige `/platos` a la app del comensal. En producción añade en el `vercel.json` de staff una regla:

```json
{ "source": "/platos/:p*", "destination": "https://TU-COMENSAL.vercel.app/platos/:p*" }
```

(ponla antes del fallback SPA), o copia `apps/comensal-pwa/public/platos` a `apps/staff-web/public/platos`.

## 4. Vercel (hacerlo dos veces: comensal y staff)

1. vercel.com → **Add New → Project** → importa el repo de GitHub.
2. **Root Directory**: `apps/comensal-pwa` (luego `apps/staff-web` en el segundo proyecto).
3. Framework Preset: **Vite** (autodetectado).
4. Build command: `pnpm build` (ejecuta `tsc && vite build`). Output: `dist`. Install: déjalo por defecto (Vercel detecta `pnpm-lock.yaml` en la raíz del monorepo).
5. Environment Variables: `VITE_SOCKET_URL` (y `VITE_DEFAULT_LANG=es` si se usa).
6. **Deploy**.
7. Copia los dominios finales y ponlos en `CORS_ORIGINS` de los 6 servicios (redeploy de estos).

## 5. Pruebas finales

- Comensal: abre la carta, haz un pedido de prueba y mira que el estado cambie en tiempo real.
- Staff: inicia sesión, abre cocina (KDS) y comprueba "WebSocket Conectado".
- Consola del navegador (F12): sin errores CORS ni 404 de `/api/v1/...`.
- QR de mesas: regenera con el dominio real (`scripts/demo-qr.js` apunta a local).

## 6. Seguridad antes de abrirlo al público

- Cambia contraseñas y secretos de demo (`tacama_secret_2024`, `cambia_esta_clave…`, usuarios del seed).
- No expongas Postgres/Redis/RabbitMQ públicamente (en Railway usa la red privada).
- Swagger (`/api/docs`) público: desactívalo en producción si no lo necesitas.

## 7. Alternativa más simple

Si no quieres separar el backend: un VPS (DigitalOcean, Hetzner) con `docker compose` + Traefik sirve todo en un solo dominio, sin rewrites ni cambios de WebSocket. Vercel quedaría solo si quieres su CDN para los frontends.
