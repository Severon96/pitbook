# ─────────────────────────────────────────
# Pitbook Web Dockerfile
# Multi-stage: development + production
# ─────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app

# ── Development ───────────────────────────
FROM base AS development
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN npm ci

COPY . .
EXPOSE 3000
WORKDIR /app/apps/web
CMD ["npm", "run", "dev"]

# ── Build ─────────────────────────────────
FROM base AS build
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN npm ci

COPY . .
RUN npm run build --workspace=@pitbook/web

# ── Production (nginx) ────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
