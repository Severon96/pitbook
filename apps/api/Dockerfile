# ─────────────────────────────────────────
# Pitbook API Dockerfile
# Multi-stage: development + production
# ─────────────────────────────────────────

# Base
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare yarn@stable --activate

# ── Development ───────────────────────────
FROM base AS development
COPY package.json yarn.lock .yarnrc.yml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN yarn install

COPY . .

# Generate Prisma client
RUN yarn workspace @pitbook/db generate

WORKDIR /app/apps/api
CMD ["yarn", "dev"]

# ── Build ─────────────────────────────────
FROM base AS build
COPY package.json yarn.lock .yarnrc.yml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn workspace @pitbook/db generate
RUN yarn workspace @pitbook/api build

# ── Production ────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/packages/db/generated ./packages/db/generated

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main"]
