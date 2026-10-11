# ============================================================
# Dockerfile base para microservicios NestJS — TacamaMesa
# Copia este archivo a cada services/<nombre>/Dockerfile
# ============================================================

# ── Etapa base ───────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm@8.15.4
WORKDIR /app

# ── Etapa de dependencias ────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ── Etapa de desarrollo (hot-reload con ts-node) ──────────────
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Genera cliente Prisma
RUN pnpm exec prisma generate
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

# ── Etapa de build ────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

# ── Etapa de producción ───────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
