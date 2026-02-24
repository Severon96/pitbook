# ─────────────────────────────────────────
# Pitbook API Dockerfile
# Multi-stage: development + production
# ─────────────────────────────────────────

# Base
FROM node:20-alpine AS base
WORKDIR /app

# ── Development ───────────────────────────
FROM base AS development
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN npm ci

COPY . .

# Build db package
RUN npm run build --workspace=@pitbook/db

WORKDIR /app/apps/api
CMD ["npm", "run", "dev"]

# ── Build ─────────────────────────────────
FROM base AS build
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN npm ci

COPY . .
RUN npm run build --workspace=@pitbook/db
RUN npm run build --workspace=@pitbook/api

# ── Production ────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/packages/db/dist ./packages/db/dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main"]
