# 🏁 Pitbook

**Vehicle management & cost tracking** — your personal pit crew for every car.

Track maintenance, repairs, fuel costs, and seasonal expenses for your daily driver and track/hobby vehicles.

---

## Features

- 🚗 **Daily vehicle** management with unlimited cost entries
- 🏎️ **Seasonal vehicles** with per-season cost tracking
- ⛽ **Spritmonitor.de integration** — auto-sync fuel logs every 6h
- 🔧 **Cost breakdowns** — itemize orders (parts, shipping, labor separately)
- 📊 **Reports** — per season, per year, or all-time
- 📥 **Export** — CSV/PDF export with full item breakdown

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind |
| Backend  | NestJS + TypeScript                 |
| Database | PostgreSQL 16                       |
| ORM      | Drizzle 0.36                        |
| Infra    | Docker Compose (3 containers)       |

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Node.js 20+ (for local dev without Docker)
- Yarn

### 1. Clone & Configure

```bash
git clone <repo>
cd pitbook

# Copy env file and adjust if needed
cp .env.example .env
```

### 2. Start with Docker Compose

```bash
# Start all three containers (Postgres, API, Web)
docker compose up

# First time: run DB migrations + seed
docker compose exec api yarn workspace @pitbook/db migrate
docker compose exec api yarn workspace @pitbook/db seed
```

### 3. Access

| Service       | URL                          |
|---------------|------------------------------|
| Frontend      | http://localhost:3000        |
| API           | http://localhost:3001        |
| Swagger Docs  | http://localhost:3001/api/docs |
| DB Studio     | `yarn db:studio`             |

---

## Local Development (without Docker)

```bash
# Install dependencies
yarn install

# Start Postgres only via Docker
docker compose up postgres

# Generate Drizzle migrations
yarn db:generate

# Run migrations
yarn db:migrate

# Seed with example data
yarn db:seed

# Start API + Web in parallel
yarn dev
```

---

## Project Structure

```
pitbook/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   └── src/
│   │       ├── vehicles/    # Vehicle CRUD
│   │       ├── seasons/     # Season management
│   │       ├── cost-entries/ # Cost tracking
│   │       ├── fuel-logs/   # Fuel log management
│   │       ├── spritmonitor/ # API integration
│   │       └── reports/     # Cost reports & export
│   └── web/                 # React Frontend
│       └── src/
│           ├── pages/
│           ├── components/
│           └── api/         # API client hooks
├── packages/
│   ├── db/                  # Drizzle schema + migrations
│   └── types/               # Shared TypeScript types
└── docker-compose.yml
```

---

## Spritmonitor Integration

1. Go to **Settings** → **Spritmonitor**
2. Enter your Spritmonitor API key
3. Select which local vehicle matches your Spritmonitor vehicle
4. Click **Sync now** — fuel logs will import automatically

Pitbook auto-syncs every 6 hours and deduplicates entries.

---

## Cost Entry with Item Breakdown

When adding a repair or parts order, you can break it down into line items:

```
Bremsenrevision                    780,00 €
  ├── Bremsscheiben vorne (Paar)   180,00 €
  ├── Bremsscheiben hinten (Paar)  150,00 €
  ├── Bremsbeläge vorne             85,00 €
  ├── Bremsbeläge hinten            65,00 €
  ├── Arbeitszeit 3h               270,00 €
  ├── Versandkosten                  8,00 €
  └── Entsorgung Altteile           22,00 €
```

This breakdown appears in exports and reports.

---

## Deployment (Production)

```bash
# Build production images
NODE_ENV=production docker compose up --build

# Or push images to registry and deploy on VPS
docker compose -f docker-compose.yml up -d
```

Make sure to set strong values for `POSTGRES_PASSWORD` and `JWT_SECRET` in your production `.env`.
