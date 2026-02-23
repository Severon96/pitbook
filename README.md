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

---

## Authentication

Pitbook supports two authentication methods:

### Local Authentication (Default)
Users create accounts with email and password. The first user becomes an admin.

### OAuth/OIDC (Optional)
Integrate with your existing identity provider (Keycloak, Authentik, Authelia, etc.).

#### OAuth Configuration

Add these environment variables to your `.env` file:

```bash
# Enable OAuth/OIDC
OIDC_ENABLED=true

# OIDC Provider Settings
OIDC_ISSUER_URL=https://your-keycloak.example.com/realms/pitbook
OIDC_CLIENT_ID=pitbook
OIDC_CLIENT_SECRET=your_client_secret
OIDC_REDIRECT_URI=http://localhost:3001/auth/oauth/callback

# Optional: Customize scopes (defaults to "openid profile email")
OIDC_SCOPE=openid profile email

# Frontend URL for post-auth redirects
FRONTEND_URL=http://localhost:3000
```

#### Provider-Specific Setup

**Keycloak:**
1. Create a new realm (e.g., "pitbook")
2. Create a new client:
   - Client ID: `pitbook`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3001/auth/oauth/callback`
3. Go to Credentials tab and copy the Secret
4. Set `OIDC_ISSUER_URL` to `https://your-keycloak/realms/pitbook`

**Authentik:**
1. Create a new OAuth2/OIDC Provider
   - Name: Pitbook
   - Client Type: Confidential
   - Redirect URIs: `http://localhost:3001/auth/oauth/callback`
2. Create an Application and link it to the provider
3. Copy Client ID and Client Secret
4. Set `OIDC_ISSUER_URL` to your Authentik issuer URL

**Authelia:**
1. Add a new client to your Authelia configuration:
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
2. Set `OIDC_ISSUER_URL` to your Authelia URL

#### How It Works

1. When OAuth is enabled, a "Sign in with SSO" button appears on the login page
2. Users click the button and are redirected to your identity provider
3. After successful authentication, users are redirected back to Pitbook
4. User accounts are automatically created from the OAuth profile data
5. No password is stored for OAuth users

---

## Spritmonitor Integration

Pitbook can display your vehicle's current average fuel consumption directly from [Spritmonitor.de](https://www.spritmonitor.de).

### Setup

1. **Get your API key** — log in to Spritmonitor and generate an API key at [My Account → Change Password](https://www.spritmonitor.de/en/my_account/change_password.html) (the token field is at the bottom of that page).

2. **Link a vehicle** — open a vehicle's detail page in Pitbook and find the **Spritmonitor** card:
   - Enter your API key and click **Find Vehicles**
   - Select the matching vehicle from the dropdown
   - Click **Link**

3. **Done** — the card now shows the live average consumption (e.g. `Ø 7.2 l/100km`) and a direct link to the vehicle's Spritmonitor page.

To remove the link, click **Unlink** in the Spritmonitor card.

### Notes

- The API key and Spritmonitor vehicle ID are stored per vehicle, so you can link different vehicles to different Spritmonitor accounts.
- Consumption data is fetched live from the Spritmonitor API each time you open the vehicle detail page; nothing is cached or synced locally.