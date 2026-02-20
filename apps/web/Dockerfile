# ─────────────────────────────────────────
# Pitbook Web Dockerfile
# Multi-stage: development + production
# ─────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare yarn@stable --activate

# ── Development ───────────────────────────
FROM base AS development
COPY package.json yarn.lock .yarnrc.yml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN yarn install

COPY . .
EXPOSE 3000
WORKDIR /app/apps/web
CMD ["yarn", "dev"]

# ── Build ─────────────────────────────────
FROM base AS build
COPY package.json yarn.lock .yarnrc.yml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn workspace @pitbook/web build

# ── Production (nginx) ────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
