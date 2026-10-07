# Zestora

A hyperlocal **food delivery and quick-commerce (grocery) platform** for Bhatkal and the Karnataka coast.
Four connected experiences in one product: **customers** order food and groceries, **restaurant partners** run their menu and kitchen,
**delivery riders** complete deliveries, and **admins** oversee everything.

| Part | Folder | Stack |
|---|---|---|
| API | [`backend/`](backend/README.md) | Java 21, Spring Boot 3.5, Spring Security + JWT, JPA/Hibernate, Flyway, PostgreSQL, WebSocket (STOMP), Razorpay, Cloudinary |
| Web app | [`frontend/`](frontend/README.md) | React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS |
| CI | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Backend `mvn verify` + frontend typecheck, tests, build |

More docs: [IDEA](IDEA.md) (what and why) · [ARCHITECTURE](ARCHITECTURE.md) (design and workflows) · [PROGRESS](PROGRESS.md) (status and changelog) ·
[DEPLOYMENT](DEPLOYMENT.md) · [CONTRIBUTING](CONTRIBUTING.md) · [backend/DEMO_ACCOUNTS.md](backend/DEMO_ACCOUNTS.md)

---

## What it does

**Customer**
- Browse nearby restaurants with search, cuisine chips and a Pure-veg filter; save favourites (kept in the browser only).
- Open a restaurant: sticky menu search, veg-only toggle, category chips, dish cards with an Add button that turns into a quantity stepper.
- Grocery store ("QuickMart") with its own search and stock-aware items.
- Cart (one restaurant at a time), checkout with address, coupon, payment method and rider tip, then live order tracking.
- Orders list, order detail with status timeline, support tickets, reviews after delivery.

**Restaurant partner (owner or manager)**: see incoming orders, accept / prepare / mark ready, and edit their own menu (prices, availability, new dishes).

**Delivery rider**: see assigned deliveries, pick up, and complete with the customer's delivery OTP.

**Admin**: platform metrics, restaurants and partners, riders, coupons, users and support.

**Rules the server enforces (never the browser):** every price and total is recomputed from the database; delivery is ₹40 and free from ₹499
on food orders; packaging is ₹15 (food only); platform fee ₹5; GST 5%. Orders follow a fixed state machine, only the owning customer or the
restaurant's own staff can see or change an order (everyone else gets 404), and an unpaid order cannot be accepted by the kitchen.

## The restaurants in the app

With the `bhatkal` profile, exactly three real restaurants are loaded from [`backend/src/main/resources/seed/curated-restaurants.json`](backend/src/main/resources/seed/curated-restaurants.json):

| Restaurant | Items | Owner login (email) |
|---|---|---|
| Layali Arabia Restaurant | 102 in 12 categories | `layali-arabia-restaurant@zestora.local` |
| Udupi Deluxe – Pure Veg Restaurant | 236 in 22 categories | `udupi-deluxe-pure-veg-restaurant@zestora.local` |
| The Royal Olives Restaurant | 193 in 25 categories | `the-royal-olives-restaurant@zestora.local` |

Menus are entered exactly as each restaurant supplied them (names, prices, veg labels, descriptions). **Nothing is invented:** an unknown price
shows "Price on request" and cannot be ordered, an unknown veg status shows no dot, and unknown facts (address, phone, hours, rating, delivery
time) are simply left out. Only restaurants with a supplied picture show one; there are no stock or borrowed food photos.

## Quick start (development)

Prerequisites: Java 21, Maven, Node 20+, Docker Desktop.

```bash
# 1. Backend settings: copy the template and fill it in (the file is git-ignored)
cd backend
cp .env.example .env            # PowerShell: Copy-Item .env.example .env
#    set DATABASE_PASSWORD, JWT_SECRET (>= 32 random chars) and DEMO_PASSWORD

# 2. Database (PostgreSQL in Docker, port 5433) and API (http://localhost:8080)
docker compose up -d
mvn spring-boot:run -Dspring-boot.run.profiles=dev,bhatkal   # plain "dev" loads six made-up sample restaurants instead (used by the tests)

# 3. Web app (http://localhost:5173), in a second terminal
cd ../frontend
npm install
npm run dev
```

Log in with the accounts in [`backend/DEMO_ACCOUNTS.md`](backend/DEMO_ACCOUNTS.md); all of them use the `DEMO_PASSWORD` from your `backend/.env`.
Without Razorpay keys the payment step shows a **"Simulate successful payment"** button (development only).

## Configuration

Every secret and setting comes from environment variables; nothing is hard-coded. In development they live in `backend/.env`; in production
they are real environment variables on the host. The full annotated list is in [`backend/.env.example`](backend/.env.example).

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | PostgreSQL connection (local Docker or hosted, e.g. Supabase) |
| `JWT_SECRET` | Signs login tokens, at least 32 characters; the app will not start without it |
| `DEMO_PASSWORD` | Shared password for seeded demo accounts (development only) |
| `CORS_ALLOWED_ORIGINS`, `COOKIE_SECURE` | Web origin(s) and secure cookies (`true` in production) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payments. Empty in development = simulator. **Required in production** |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Signed image uploads |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Creates the first admin on an empty production database (remove after the first start) |
| `SPRING_PROFILES_ACTIVE` | `dev` (default), `dev,bhatkal`, or `prod` |

## Tests

```bash
cd backend  && mvn test      # unit + end-to-end + WebSocket tests on a real PostgreSQL (Docker must be running)
cd frontend && npm test      # component and unit tests (also: npx tsc --noEmit, npm run build)
```

Current status: backend 51 tests, frontend 49 tests, all passing; CI runs both on every push.
The backend tests cover login and token rotation, role access, ownership (other customers get 404), server-side pricing (client-sent prices are
ignored), the payment flow including forged signatures, the full order lifecycle with OTP, unpriced items, WebSocket topic authorization, and the
seed data (each restaurant's menu is checked against what was supplied).

## Production

1. **Database:** any managed PostgreSQL 14+ (Supabase, Neon, RDS...). Flyway creates the schema on first start.
   To copy only the three restaurants, their menus and owner logins from your local database to an **empty** hosted one, use
   [`backend/scripts/transfer-restaurants.sh`](backend/scripts/transfer-restaurants.sh); it reads the password from the environment and
   copies no customers, orders or payments.
2. **API:** a `backend/Dockerfile` is included for container hosts, or `cd backend && mvn -DskipTests package`, then `SPRING_PROFILES_ACTIVE=prod java -jar target/zestora-backend-*.jar` with the variables above.
   The `prod` profile has no demo data and no payment simulator, and refuses to start without payment keys.
3. **Web app:** `cd frontend && npm run build`, then serve `frontend/dist` from a static host. For Vercel the root directory is `frontend`
   (`vercel.json` supplies the SPA fallback). Route `/api` (and `/ws`) to the API on the same domain; see [DEPLOYMENT.md](DEPLOYMENT.md).

## Project layout

```
backend/    Spring Boot API: auth, catalog, order, payment, delivery, promotion, review, support, admin, realtime, seed
  src/main/resources/db/migration   Flyway SQL (the schema is owned here, Hibernate only validates)
  src/main/resources/seed           The three restaurants' menus
  scripts/                          transfer-restaurants.sh (copy restaurants to a hosted database)
frontend/   React app: pages/{customer,partner,rider,admin,auth}, components, cart, auth, api, realtime
```

## Security notes

- Passwords hashed with BCrypt; 15-minute access token kept in memory; rotating refresh token in an httpOnly `SameSite=Strict` cookie with reuse detection.
- Rate limit of 10 requests per minute per IP on login, register and refresh.
- Row-level security is enabled on every table, so a hosted database's public API keys cannot read or write anything; the API connects as the owner role.
- Real-time topics check who may subscribe (a customer only sees their own order).
- No secret is stored in the repository; tests generate random ones.
