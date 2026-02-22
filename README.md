# 🏁 Pitbook

**Vehicle management & cost tracking** — your personal pit crew for every car.

Track maintenance, repairs, fuel costs, and seasonal expenses for your daily driver and track/hobby vehicles.

---

## Features

- 🚗 **Daily vehicle** management 
- 🏎️ **Seasonal vehicles** management
- 🔧 **Cost breakdowns** — Service, repair, fuel costs
- 📊 **Reports** — per season, per year, or all-time
- 📥 **Export** — CSV/PDF export with full item breakdown

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind |
| Backend  | NestJS + TypeScript                     |
| Database | PostgreSQL 16                           |
| ORM      | Drizzle                                 |
---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Node.js 20+ (for local dev without Docker)
- NPM

### 1. Clone & Configure

```bash
git clone https://github.com/Severon96/pitbook.git
cd pitbook

# Copy env file and adjust if needed
cp .env.example .env
```

### 2. Start with Docker Compose

```bash
# Start all three containers (Postgres, API, Web)
docker compose up
```

### 3. Access

| Service       | URL                            |
|---------------|--------------------------------|
| Frontend      | http://localhost:3000          |
| API           | http://localhost:3001          |
| Swagger Docs  | http://localhost:3001/api/docs |