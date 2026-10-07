# Zestora Backend (Spring Boot)

Java 21 · Spring Boot 3.5 · Spring Data JPA/Hibernate · PostgreSQL (local Docker for now) · Flyway · Spring Security + JWT ·
WebSocket (STOMP) · Razorpay · Cloudinary · Maven · JUnit 5 + Mockito + Testcontainers.

## Run locally

```bash
# 1. one-time: create your private settings file (git ignores it) and edit the values
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
#    set DATABASE_PASSWORD, JWT_SECRET (>= 32 random chars) and DEMO_PASSWORD

# 2. local PostgreSQL in Docker on port 5433 (reads DATABASE_* from .env)
docker compose up -d

# 3. start the API on http://localhost:8080 (dev profile: reads .env, seeds demo data, payment simulator on)
mvn spring-boot:run
```

**No secret is stored in the code or in any committed file.** Everything sensitive comes from `backend/.env` (development) or real
environment variables (production). `backend/.env.example` lists every variable with placeholder values.

Swagger UI (dev only): http://localhost:8080/swagger-ui.html

### Real Bhatkal-area demo restaurants (optional)
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev,bhatkal
```
Adds 13 real places around Bhatkal (Bhatkal, Murdeshwar, Byndoor, Honnavar) from OpenStreetMap, each with a restaurant-owner login, and hides the six
made-up sample restaurants. Logins are listed in [`DEMO_ACCOUNTS.md`](DEMO_ACCOUNTS.md). It is additive and safe to restart (existing owners are skipped).
**The menus and prices are samples chosen by restaurant type; OpenStreetMap has no menus.** Place data: (c) OpenStreetMap contributors, ODbL.
A second file, `src/main/resources/seed/curated-restaurants.json`, holds **hand-entered restaurants with real menus** (currently Layali Arabia Restaurant,
transcribed from its printed menu). Unknown facts are left out, never invented: a missing price means "ask the restaurant" (the item shows and cannot be ordered),
a missing `veg` means unknown (no veg/non-veg dot). To add another restaurant, copy its entry format; `SeedDataTest` checks every entry.
Regenerate or extend the OpenStreetMap list with `python scripts/generate_bhatkal_seed.py` (fetches from the Overpass API).
The tests do not use this profile.

### Demo logins (dev profile only: never seeded in production)
Every seeded account uses the **one password you set as `DEMO_PASSWORD` in `backend/.env`**.

| Role | Email |
|---|---|
| Customer | customer@zestora.com |
| Super admin | admin@zestora.com |
| Restaurant owner (sample "Spice Garden", hidden by the `bhatkal` profile) | spicegarden@zestora.local |
| Rider (online) | rahul.rider@zestora.local |
| 13 Bhatkal-area restaurant owners | see [`DEMO_ACCOUNTS.md`](DEMO_ACCOUNTS.md) |

Demo data is created only when the database is empty, so changing `DEMO_PASSWORD` later does not change existing accounts
(reset the database volume to reseed).

## Environment variables
Put these in `backend/.env` for development (see `.env.example`) or set them in the environment for production.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | optional | Defaults to the Docker database `jdbc:postgresql://localhost:5433/zestora`. For a hosted database use its JDBC URL, e.g. Supabase: `jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require` (direct connection; with a pooler on port 6543 add `&prepareThreshold=0`) |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | **yes** | No defaults. Also used by `docker compose` to create the local database. For a hosted database use its database user and password (never an API key) |
| `JWT_SECRET` | **yes** | >= 32 random characters, no default. The app refuses to start without it |
| `DEMO_PASSWORD` | dev only | Shared password for all seeded demo accounts (>= 8 characters). Seeding refuses to run without it |
| `SPRING_PROFILES_ACTIVE` | prod | `prod` disables seed data and the payment simulator and does not read `.env` |
| `CORS_ALLOWED_ORIGINS` | prod | Comma-separated front-end origins |
| `COOKIE_SECURE` | prod | `true` behind HTTPS (the `prod` profile sets it) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | prod | Leave empty in dev to use the payment simulator. In prod the app will not start without keys |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for uploads | `POST /api/v1/media/sign` returns 503 until set |

## Database
Development uses the PostgreSQL container from `docker-compose.yml` (port 5433, database `zestora`, user and password from `backend/.env`).
The data lives in the Docker volume `zestora-db-data`.
If port 5433 is busy, change the left side of the port mapping in `docker-compose.yml` and set `DATABASE_URL` to match.
To use your own PostgreSQL installation instead, create an empty database and set the three `DATABASE_*` variables; Flyway builds the tables on first start.

### Hosted database later (e.g. Supabase)
Flyway creates the schema on first start (`src/main/resources/db/migration`). `V2` enables Row Level Security on every
table with no policies, so Supabase's public REST API (anon key) cannot read or write any Zestora data; this backend
connects as the database owner and is the only way in.

## API
All routes are under `/api/v1`, responses use `{success, data}` / `{success:false, error:{code,message}}`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register, /auth/login, /auth/refresh, /auth/logout`, `GET /auth/me` |
| Catalogue (public) | `GET /restaurants`, `/restaurants/{id}`, `/restaurants/{id}/reviews`, `/products/{id}`, `/grocery/products` |
| Coupons | `GET /coupons` (public), `POST /coupons/validate` |
| Orders | `POST /orders`, `GET /orders/me`, `GET /orders/{id}`, `PATCH /orders/{id}/status` |
| Payments | `POST /payments/{orderId}/checkout`, `/verify`, `/simulate` (dev), `POST /payments/razorpay/webhook` |
| Reviews / support | `POST /reviews`, `POST /support/tickets`, `GET /support/tickets/me`, `POST /support/tickets/{id}/messages` |
| Restaurant partner | `GET /partner/orders`, `GET /partner/restaurant` (own menu), `PATCH /partner/restaurant/open`, `POST/PUT /partner/products`, `PATCH /partner/reviews/{id}/reply` |
| Rider | `GET /rider/orders`, `GET /rider/profile`, `PUT /rider/status`, `POST /rider/location` |
| Admin | `GET /admin/metrics, /admin/users, /admin/orders, /admin/audit-logs, /admin/support/tickets`, `POST /admin/users, /admin/restaurants, /admin/riders, /admin/coupons`, `PATCH /admin/coupons/{id}/active` |
| Media | `POST /media/sign` (Cloudinary signed upload) |

WebSocket: connect STOMP to `/ws` with header `Authorization: Bearer <access token>`, then subscribe to
`/topic/order/{id}`, `/topic/restaurant/{id}/orders`, `/user/queue/jobs` (riders), `/topic/admin/live` (admins).

## Security design (short)
- Access JWT (15 min) in the response body; refresh token is opaque, hashed in the DB, rotated on every use, delivered in an
  `httpOnly; SameSite=Strict` cookie scoped to `/api/v1/auth`; re-use of an old refresh token revokes the whole session.
- BCrypt passwords; constant-time-ish login (no user enumeration); per-IP rate limit on login/register/refresh.
- Prices and totals are computed server-side from DB rows; the client sends only product ids and quantities.
- Ownership checks on every order (customer / restaurant / assigned rider / admin); outsiders get `404`.
- Order state machine decides who may set which status; the rider needs the customer's 4-digit code to finish a delivery.
- Payments: amount comes from the stored order, HMAC-verified callback and webhook, idempotent webhook events,
  simulator disabled outside the dev profile.
- Grocery stock is row-locked at order time (no overselling) and released if the order is cancelled or never paid (30 min).

## Tests
```bash
mvn test        # (needs no .env: tests generate random secrets) 23 unit + 15 end-to-end + 5 WebSocket tests against a real PostgreSQL (needs Docker running)
```
