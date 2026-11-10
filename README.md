# TacamaMesa

> Sistema de atención digital del restaurante **El Tambo de Tacama**  
> Viña Tacama S.A. — Ica, Perú  
> Proyecto universitario · Arquitectura Empresarial TOGAF ADM
>
> **© 2026 Proyecto académico desarrollado por estudiantes de la Universidad Tecnológica del Perú (UTP), en un entorno académico.** Todos los derechos de autor reservados. Sin fines comerciales; la marca, la carta y las imágenes de El Tambo de Tacama pertenecen a sus titulares y se usan solo con fines académicos. Ver [COPYRIGHT.md](COPYRIGHT.md).

[![CI](https://github.com/tu-usuario/tacamamesa/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-usuario/tacamamesa/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![Proyecto académico](https://img.shields.io/badge/Proyecto-acad%C3%A9mico%20UTP-blue)](COPYRIGHT.md)

---

## Descripción

TacamaMesa digitaliza la experiencia del comensal en El Tambo de Tacama:
- Menú digital multiidioma vía código QR
- Declaración de alergias obligatoria antes de ordenar
- Recomendaciones de maridaje (vinos y piscos Tacama) en tiempo real
- Pantalla de cocina con alertas de alérgenos (WebSocket)
- Gestión de inventario con integración sandbox a la bodega

---

## Arquitectura

```
Comensal (QR/PWA)  →  API Gateway (Traefik)  →  Microservicios NestJS
                                                 PostgreSQL (schemas aislados)
                                                 Redis (caché)
                                                 RabbitMQ (eventos async)
                                                 Socket.IO (tiempo real)
```

Ver diagrama completo en [`arquitectura_tacamamesa.md`](./docs/arquitectura_tacamamesa.md).

### Microservicios

| Servicio | Puerto | Responsabilidad |
|---|---|---|
| `auth-service` | 3001 | Autenticación JWT, token de mesa por QR |
| `catalogo-i18n-service` | 3002 | Carta, platos, alérgenos, traducciones (es/en/fr/pt/de) |
| `maridaje-service` | 3003 | Reglas y recomendaciones vino/pisco por plato |
| `comandas-service` | 3004 | Pedidos, validación de alérgenos, WebSocket cocina |
| `inventario-service` | 3005 | Stock etiquetas, movimientos, sandbox bodega |
| `analitica-auditoria-service` | 3006 | KPIs, CSAT, audit log inmutable |

---

## Cómo levantar el proyecto

### Pre-requisitos

```bash
node --version   # >= 20.0.0
pnpm --version   # >= 8.0.0
docker --version # >= 24.0.0
```

Instalar pnpm si no lo tienes:
```bash
npm install -g pnpm@8.15.4
```

### 1. Clonar y configurar variables de entorno

```bash
git clone https://github.com/tu-usuario/tacamamesa.git
cd tacamamesa

# Copiar y editar variables de entorno
cp .env.example .env
# Editar .env con tus valores (mantener los defaults para dev local)
```

### 2. Instalar dependencias del monorepo

```bash
pnpm install
```

### 3. Levantar infraestructura (PostgreSQL, Redis, RabbitMQ, Traefik)

```bash
# Solo infraestructura (sin servicios)
docker-compose up -d postgres redis rabbitmq traefik bodega-sandbox

# Verificar que todo está saludable
docker-compose ps
```

Esperar ~30 segundos a que PostgreSQL y RabbitMQ inicien completamente.

### 4. Ejecutar migraciones y datos de prueba

```bash
# Desde la raíz del monorepo
pnpm run db:migrate
pnpm run db:seed
```

Esto crea:
- 8 platos peruanos en la carta
- 10 etiquetas de vino y pisco Tacama
- 12 reglas de maridaje
- 6 mesas con códigos QR
- Usuarios por rol (contraseñas en `.env`)

### Atajo: todo con un comando (Windows)

```bash
pnpm run dev:local    # infraestructura + Prisma + seeds + 6 servicios + 2 apps
pnpm run stop:local   # detiene servicios y apps (Docker sigue arriba)
```

Logs en `logs/`. El API Gateway (Traefik, http://localhost) enruta a los servicios locales vía `infra/traefik/dynamic.yml`; los frontends usan el proxy de Vite.

### 5. Levantar todos los servicios en modo desarrollo

```bash
# Opción A: con Docker (recomendado)
docker-compose up -d

# Opción B: local con hot-reload (para desarrollo activo)
pnpm run dev
```

### 6. Verificar que todo funciona

| Servicio | URL |
|---|---|
| API Gateway | http://localhost |
| Traefik Dashboard | http://localhost:8080 |
| RabbitMQ Management | http://localhost:15672 |
| Auth Swagger | http://localhost:3001/api/docs |
| Catálogo Swagger | http://localhost:3002/api/docs |
| Maridaje Swagger | http://localhost:3003/api/docs |
| Comandas Swagger | http://localhost:3004/api/docs |
| Inventario Swagger | http://localhost:3005/api/docs |
| Analítica Swagger | http://localhost:3006/api/docs |
| Comensal PWA | http://localhost:5173 |
| Staff Web | http://localhost:5174 |

---

## Tests

```bash
# Todos los tests unitarios
pnpm run test

# Tests e2e
pnpm run test:e2e

# Test de un servicio específico
pnpm --filter @tacamamesa/auth-service test
```

---

## Estructura del monorepo

```
tacamamesa/
├── .github/workflows/    ← CI/CD GitHub Actions
├── infra/
│   ├── postgres/         ← init.sql (schemas)
│   ├── rabbitmq/         ← exchanges y queues
│   └── sandbox/          ← WireMock (bodega simulada)
├── packages/
│   ├── shared-types/     ← tipos e interfaces del dominio
│   ├── shared-utils/     ← utilidades comunes
│   └── shared-errors/    ← códigos de error centralizados
├── apps/
│   ├── comensal-pwa/     ← PWA React para el comensal
│   └── staff-web/        ← Web React para el personal
├── services/
│   ├── auth-service/
│   ├── catalogo-i18n-service/
│   ├── maridaje-service/
│   ├── comandas-service/
│   ├── inventario-service/
│   └── analitica-auditoria-service/
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Experiencia del comensal y accesos por rol

**Comensal (PWA, http://localhost:5173):** la primera pantalla pregunta si es **peruano o extranjero**.
- *Extranjero*: debe declarar sus alergias (o indicar que no tiene ninguna), sus gustos para el plato de fondo (proteína, intensidad, tipo de plato) y si desea entrada y/o postre, con su preferencia de sabor para cada uno (independiente del fondo); con ello recibe "Recomendados para usted".
- *Peruano*: las preferencias son opcionales; puede omitirlas y elegir directo de la carta.

**Idioma (i18n):** se detecta solo desde la configuración del dispositivo (`navigator.languages`): español, inglés, francés, portugués o alemán; si el dispositivo usa otro idioma sin traducción, inglés (idioma universal de respaldo). No hay selector manual. La carta se traduce en el servidor según `Accept-Language`; las traducciones fr/pt/de están en `infra/data/carta-i18n.json` (regenerar con `node infra/data/build-i18n.js`).

**Mesas con varios comensales:** si una sola persona escanea el QR por toda la mesa, la primera pantalla pregunta cuántas son (1 a 8). Cada comensal completa su propio perfil (alergias obligatorias y gustos, con nombre opcional) en un mismo celular; en la carta se elige para quién se pide, cada ítem queda asignado a un comensal (reasignable en la comanda) y la advertencia de alergias se evalúa por persona. A cocina llega una sola comanda con las alergias de todos en las restricciones y, en la nota de cada ítem, el comensal y su alergia.

**Desayuno y almuerzo:** la carta se segmenta por momento del día. Cada plato tiene un rol (entrada, fondo, desayuno, postre, complemento, kids, bebida) y los momentos en que se ofrece (`infra/data/build-carta.js`, bloque "Rol en la comida y momento del día"). Los sandwiches se tratan como desayuno y nunca se recomiendan como plato de fondo; en desayuno no se ofrece postre. El momento se propone según la hora (antes de las 11:00, desayuno) y el comensal lo cambia con un selector.

**Carta:** 104 ítems de la carta oficial del Tambo de Tacama (platos, bebidas, café, infusiones) con fotos recortadas del PDF, y 22 etiquetas de vinos y piscos con 112 reglas de maridaje. Fuente única en `infra/data/` (regenerar con `node infra/data/build-carta.js`). Los alérgenos se infieren de la descripción de cada plato y los precios de vinos y piscos son referenciales: la cocina debe validarlos.

**Información nutricional:** cada plato muestra su energía (kcal y kJ) y sus macronutrientes por porción, y el carrito y la recomendación suman el total de lo que se está eligiendo. Son valores **referenciales**, calculados con las Tablas Peruanas de Composición de Alimentos (CENAN / INS, Minsa) como referencia y recetas estándar; regenerar con `node infra/data/build-nutricion.js`. La cocina o un nutricionista debe validarlos con las recetas reales.

**Personalizar un plato:** en las entradas, los principales, los desayunos, el menú kids y los piqueos (52 platos) el comensal puede quitar ingredientes (por ejemplo "sin cebolla", "sin papas fritas"), marcar si lo pide por alergia y escribir un pedido especial. La energía del carrito se descuenta según lo que quita. La cocina lo ve resaltado en la pantalla KDS (en rojo si es por alergia). Se puede cambiar o quitar durante los 5 minutos posteriores a confirmar el pedido. Los ingredientes retirables de cada plato se definen en `infra/data/build-nutricion.js` (tabla `OPC`) y deben validarse con la cocina.

**Personal (http://localhost:5174):** login con JWT; cada rol ve solo sus módulos. La pantalla de ingreso ya no lista cuentas: cada persona entra con la cuenta que el **administrador** le crea en el módulo **Cuentas** (alta, cambio de rol, restablecer contraseña, activar y desactivar). Las contraseñas se guardan cifradas (bcrypt) y el sistema nunca las muestra. La casilla "Guardar mi cuenta en este dispositivo" mantiene la sesión y recuerda el correo; la contraseña no se guarda en el sistema (la guarda, si el usuario lo acepta, el administrador de contraseñas del navegador). El administrador inicial y las cuentas de ejemplo de la tabla las crea el seed solo para desarrollo: cámbielas antes de usar el sistema con datos reales.

| Rol | Correo | Contraseña | Módulos |
|---|---|---|---|
| Administrador | admin@tacama.pe | Admin2024! | Todos (incluye Carta y precios) |
| Jefe de salón | jefe@tacama.pe | JefeSalon2024! | Mesas, Cocina, Carta y precios, KPIs, Inventario |
| Mozo | mozo1@tacama.pe, mozo2@tacama.pe, mozo3@tacama.pe | Mozo2024! | Mesas |
| Cocina | cocina@tacama.pe | Cocina2024! | Cocina (KDS) |
| Sommelier | sommelier@tacama.pe | Sommelier2024! | Sommelier, Inventario |
| Almacén | almacen@tacama.pe | Almacen2024! | Inventario |

> Solo desarrollo. NUNCA usar estas credenciales en producción.

**Mozos y mesas:** los pedidos llegan a todos los mozos. Un mozo toma una mesa sin atender con "Atender esta mesa" y queda como responsable de ella (y de las comandas nuevas de esa mesa) hasta que cierre la última y la mesa quede libre. Solo el responsable (o el jefe de salón y el administrador) confirma la entrega, cobra y libera la mesa. Cocina solo prepara.

**Cambiar o anular platos:** durante los 5 minutos posteriores a confirmar el pedido (y mientras no esté lista), el comensal puede cambiar un plato por otro o anularlo; los vinos y piscos solo se anulan (el stock se devuelve). Cocina ve la comanda marcada como "Modificada". Si se anula el único plato, se anula la comanda.

**Administración de la carta (jefe de salón y administrador):** módulo "Carta y precios" para marcar platos agotados, cambiar precios y subir fotos. Los comensales ven el cambio en menos de un minuto. En el módulo de Inventario (sommelier, almacén, jefe y administrador) se ajusta el stock y el umbral y se marcan etiquetas como agotadas. Al comensal se le muestra un aviso dinámico ("¡Últimas 2 botellas! · se agota en ~2 h") calculado con el stock y la frecuencia real de pedidos de cada etiqueta.

**Cuenta y pago:** con el pedido entregado, el comensal pide la cuenta (primero califica, luego elige efectivo, tarjeta o transferencia); el mozo ve cómo va a pagar, cobra en la mesa y confirma el pago, con lo que la mesa queda libre. El sistema no emite comprobantes de pago.

**Demo (sin publicar):** `pnpm run demo` levanta el sistema, lo deja en estado inicial con un historial de ejemplo y genera los QR de las mesas. Ver [docs/DEMO.md](docs/DEMO.md). Privacidad y protección de datos (Ley 29733): [docs/PRIVACIDAD.md](docs/PRIVACIDAD.md).

---|---|---|
| Administrador | admin@tacama.pe | Admin2024! |
| Jefe de Salón | jefe@tacama.pe | JefeSalon2024! |
| Mozo | mozo1@tacama.pe | Mozo2024! |
| Sommelier | sommelier@tacama.pe | Sommelier2024! |
| Cocina | cocina@tacama.pe | Cocina2024! |
| Almacén | almacen@tacama.pe | Almacen2024! |

---

## Endpoints principales

```
GET  /api/v1/mesas/{qr}/sesion         ← token de mesa por QR
GET  /api/v1/carta                     ← carta según Accept-Language
GET  /api/v1/platos/{id}               ← detalle de plato
GET  /api/v1/maridajes?plato={id}      ← recomendaciones de maridaje
POST /api/v1/comandas/{id}/restricciones ← declarar alergias (RN01)
POST /api/v1/comandas                  ← crear comanda
PATCH /api/v1/comandas/{id}            ← actualizar estado
DELETE /api/v1/comandas/{id}           ← anular comanda
GET  /api/v1/existencias?etiqueta={id} ← consultar stock (UUID o código, p. ej. VIN-BL-001)
GET  /api/v1/existencias/todas         ← stock de todas las etiquetas
GET  /api/v1/comandas?estado=...       ← comandas activas (KDS / salón)
GET  /api/v1/etiquetas                 ← catálogo de vinos y piscos
GET  /api/v1/indicadores/venta-cruzada ← KPIs analítica
GET  /api/v1/auditoria                 ← log de auditoría
```

---

## Convenciones

- **Código comentado en español**
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Variables sensibles**: siempre en `.env` (nunca hardcodeadas)
- **Errores**: filtro global `HttpExceptionFilter` en cada servicio
- **Pruebas**: Jest unitarios + Supertest e2e

---

## Marco teórico

Proyecto basado en **TOGAF ADM** (Architecture Development Method):
- **Arquitectura de Negocio**: flujos del restaurante digitalizados
- **Arquitectura de Datos**: modelo de dominio DDD por bounded context
- **Arquitectura de Aplicación**: SOA con microservicios REST + eventos
- **Arquitectura Tecnológica**: contenedores Docker, PostgreSQL, Redis, RabbitMQ

---

## Equipo

Proyecto universitario — Curso de Arquitectura Empresarial  
*Universidad Tecnológica del Perú — 2026*

---

## Licencia

© 2026 Estudiantes de la UTP. Todos los derechos de autor reservados; proyecto académico sin fines comerciales. Ver [`COPYRIGHT.md`](COPYRIGHT.md).
