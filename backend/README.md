# Zestora Backend (Spring Boot)

Java 21 · Spring Boot 3.5 · Spring Data JPA/Hibernate · PostgreSQL (local Docker for now) · Flyway · Spring Security + JWT ·
WebSocket (STOMP) · Razorpay · Cloudinary · Maven · JUnit 5 + Mockito + Testcontainers.

## Run locally

```bash
# 1. local PostgreSQL in Docker on port 5433 (nothing else to configure)
docker compose up -d

# 2. start the API on http://localhost:8080 (dev profile: seeds demo data, payment simulator on)
mvn spring-boot:run
```

Swagger UI (dev only): http://localhost:8080/swagger-ui.html

### Demo logins (dev profile only — never seeded in production)
| Role | Email | Password |
|---|---|---|
| Customer | customer@zestora.com | customer123 |
| Super admin | admin@zestora.com | admin123 |
| Restaurant owner (Spice Garden) | spicegarden@zestora.local | rest123 |
| Rider (online) | rahul.rider@zestora.local | rider123 |

## Environment variables
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | prod | Defaults to `jdbc:postgresql://localhost:5433/zestora` (the Docker database). For a hosted database use its JDBC URL, e.g. Supabase: `jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require` (direct connection; with a pooler on port 6543 add `&prepareThreshold=0`) |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | prod | Default `postgres` / `postgres` for the Docker database. For a hosted database use its database user and password (never an API key) |
| `JWT_SECRET` | prod | ≥ 32 random bytes. The app refuses to start without it (dev profile has a throw-away default) |
| `SPRING_PROFILES_ACTIVE` | prod | `prod` disables seed data and the payment simulator |
| `CORS_ALLOWED_ORIGINS` | prod | Comma-separated front-end origins |
| `COOKIE_SECURE` | prod | `true` behind HTTPS (the `prod` profile sets it) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | prod | Without keys the app only starts if the dev payment simulator is enabled |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for uploads | `POST /api/v1/media/sign` returns 503 until set |

## Database
Development uses the PostgreSQL container from `docker-compose.yml` (port 5433, database `zestora`, user/password `postgres`: local only).
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
mvn test        # 23 unit tests + 15 end-to-end tests against a real PostgreSQL (needs Docker running)
```
