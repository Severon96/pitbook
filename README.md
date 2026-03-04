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
- ⛽ **Spritmonitor integration** — link a vehicle and display live average fuel consumption

---

## Tech Stack

| Layer    | Technology                               |
|----------|------------------------------------------|
| Frontend | Next.js 15 + React 18 + TypeScript + Tailwind CSS |
| Backend  | NestJS + TypeScript                      |
| Database | PostgreSQL 16                            |
| ORM      | Drizzle                                  |

---

## Getting Started

### Prerequisites
- Docker + Docker Compose

### 1. Clone & Configure

```bash
git clone https://github.com/Severon96/pitbook.git
cd pitbook
```

Create a `.env` file in the project root. At minimum, set:

```bash
# Image version (use "latest" or a specific release tag, e.g. "1.0.3")
VERSION=latest

# Database
POSTGRES_USER=pitbook
POSTGRES_PASSWORD=change_me
POSTGRES_DB=pitbook
DATABASE_URL=postgresql://pitbook:change_me@postgres:5432/pitbook

# Backend
JWT_SECRET=change_me_use_a_long_random_string_at_least_32_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000   # externally accessible URL of the frontend

# Frontend
API_URL=http://api:3001              # must use the internal container port

# Ports exposed on the host (optional, defaults shown)
API_PORT=3001
WEB_PORT=3000

# OAuth/OIDC (optional, see Authentication section below)
OIDC_ENABLED=false
```

> **`API_URL` vs `FRONTEND_URL`**
> - `API_URL` is used by the frontend container to reach the API container — use the Docker service name and the **internal** container port (`http://api:3001`), never the host-mapped port.
> - `FRONTEND_URL` is used by the API for OAuth redirect URIs — use the **externally accessible** URL of the frontend (e.g. `http://192.168.1.10:3000`).

### 2. Start

```bash
docker compose up
```

Database migrations run automatically on API startup.

### 3. Access

| Service      | URL                            |
|--------------|--------------------------------|
| Frontend     | http://localhost:3000          |
| API          | http://localhost:3001          |
| Swagger Docs | http://localhost:3001/api/docs |

Ports depend on `WEB_PORT` / `API_PORT` in your `.env`.

---

## Local Development

Use the dev compose file, which builds images locally with live reload via bind mounts:

```bash
docker compose -f docker-compose.dev.yml up
```

No `.env` is required — sensible defaults are built in.

---

## Authentication

### Local (Default)
Users register with email and password. The first registered user becomes an admin.

### OAuth/OIDC (Optional)
Integrate with any OIDC-compliant identity provider (Keycloak, Authentik, Authelia, etc.).

#### Configuration

```bash
OIDC_ENABLED=true
OIDC_ISSUER_URL=https://your-provider.example.com/realms/pitbook
OIDC_CLIENT_ID=pitbook
OIDC_CLIENT_SECRET=your_client_secret
OIDC_REDIRECT_URI=http://localhost:3001/auth/oauth/callback
OIDC_SCOPE=openid profile email   # optional, this is the default
```

#### Provider-Specific Setup

**Keycloak:**
1. Create a new realm (e.g. "pitbook")
2. Create a new client:
   - Client ID: `pitbook`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3001/auth/oauth/callback`
3. Copy the Secret from the Credentials tab
4. Set `OIDC_ISSUER_URL` to `https://your-keycloak/realms/pitbook`

**Authentik:**
1. Create a new OAuth2/OIDC Provider
   - Name: Pitbook
   - Client Type: Confidential
   - Redirect URIs: `http://localhost:3001/auth/oauth/callback`
2. Create an Application linked to the provider
3. Copy Client ID and Client Secret
4. Set `OIDC_ISSUER_URL` to your Authentik issuer URL

**Authelia:**
```yaml
identity_providers:
  oidc:
    clients:
      - id: pitbook
        description: Pitbook Vehicle Management
        secret: your_client_secret
        redirect_uris:
          - http://localhost:3001/auth/oauth/callback
        scopes:
          - openid
          - profile
          - email
```
Set `OIDC_ISSUER_URL` to your Authelia URL.

#### How It Works

1. When OAuth is enabled, a "Sign in with SSO" button appears on the login page
2. Users are redirected to the identity provider and back after authentication
3. User accounts are created automatically from the OAuth profile
4. No password is stored for OAuth users

---

## Spritmonitor Integration

Pitbook can display live average fuel consumption from [Spritmonitor.de](https://www.spritmonitor.de).

### Setup

1. **Get your API key** — log in to Spritmonitor and generate a key at [My Account → Change Password](https://www.spritmonitor.de/en/my_account/change_password.html) (token field at the bottom).
2. **Link a vehicle** — open a vehicle's detail page, find the **Spritmonitor** card, enter your API key and click **Find Vehicles**, select the vehicle, then click **Link**.
3. **Done** — the card shows the live average consumption (e.g. `Ø 7.2 l/100km`) and a direct link to Spritmonitor.

To remove the link, click **Unlink** in the Spritmonitor card.

The API key and vehicle ID are stored per vehicle, so different vehicles can use different Spritmonitor accounts. Consumption data is fetched live on each page load — nothing is cached locally.
