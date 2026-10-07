# Zestora Deployment Guide

Zestora is two deployables plus a PostgreSQL database:

| Piece | What to run | Notes |
|---|---|---|
| Database | Managed PostgreSQL 14+ (Supabase, Neon, AWS RDS, Railway...) | Flyway creates and upgrades the schema on startup |
| API | `backend/` Spring Boot jar on Java 21 | `mvn -DskipTests package` then `java -jar backend/target/zestora-backend-*.jar` |
| Web app | `frontend/` static files | `npm ci && npm run build`, serve `frontend/dist` from any static host / CDN |

Development uses local Docker PostgreSQL instead (see `README.md`). No hosting has been chosen yet.

## 1. API environment variables (production)
Set these as real environment variables on the host. **Never commit them.** The full list with notes is in `backend/.env.example`.

| Variable | Required | Notes |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | yes | `prod`: no demo data, no payment simulator, secure cookies, `.env` is not read |
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | yes | JDBC URL and credentials of the managed database |
| `JWT_SECRET` | yes | >= 32 random characters (`openssl rand -hex 48`); the app will not start without it |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | yes | The app will not start in prod without payment keys. Point Razorpay's webhook at `https://<api>/api/v1/payments/razorpay/webhook` |
| `CORS_ALLOWED_ORIGINS` | yes | The web app's origin(s), comma separated |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for image uploads | |

## 2. Web app and the API
The browser calls `/api` and `/ws` on its own origin. Serve both under one domain (reverse proxy `/api` and `/ws` to the Spring Boot
service, everything else to the static files). That keeps the `SameSite=Strict` refresh cookie working and avoids CORS. In development Vite
does this proxying (`frontend/vite.config.ts`). Terminate HTTPS at the proxy and forward the `X-Forwarded-*` headers.

## 3. Release checklist
- [ ] `mvn verify` and `npm test` pass (CI does this on every push)
- [ ] Production secrets are set and rotated; no `.env` file on the server
- [ ] `SPRING_PROFILES_ACTIVE=prod`; confirm `/api/v1/payments/{id}/simulate` returns 404
- [ ] Razorpay webhook configured and tested with a test payment
- [ ] Database backups and monitoring enabled; health check: `GET /actuator/health`
- [ ] Demo accounts and the `bhatkal` profile were never used against this database

## 4. Vercel (web app only)
Vercel serves the static `frontend/` build (root directory `frontend`, build `npm run build`, output `dist`; `frontend/vercel.json` provides the single-page-app fallback).
It cannot run the Spring Boot API, so host the jar elsewhere (any Java 21 host) and point Vercel at it by adding a rewrite for `/api/(.*)` to `https://<api-host>/api/$1` in `frontend/vercel.json`.
Vercel rewrites do not carry WebSockets, so live order updates (`/ws`) need the API on a domain the browser can reach directly, or both behind one reverse proxy as in section 2.
Supabase: the direct host `db.<ref>.supabase.co` is IPv6-only; from IPv4-only hosts use the pooler (session mode, port 5432, user `postgres.<ref>`) in `DATABASE_URL`/`DATABASE_USERNAME`, with `?sslmode=require`.

## 5. First admin on a production database
Production never seeds accounts. To create the first admin, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) in the API's environment, start the API once,
log in at `/login`, then **remove both variables**. It never changes an account that already exists, and does nothing when the variables are empty.

## 6. Why the API cannot run on Vercel
Vercel runs short-lived serverless functions (Node, Python, Go, Ruby); it has no long-running Java process. The API needs one: WebSocket order updates,
scheduled jobs (unpaid orders are cancelled after 30 minutes), an in-memory login rate limit and Flyway at start-up. Running it on Vercel would mean rewriting the backend.
Use `backend/Dockerfile` on any container host (Render, Railway, Fly.io, Koyeb...): build context `backend`, set the environment variables from `backend/.env.example`, port 8080.

## 7. Railway (API) step by step
1. Railway → New Project → Deploy from GitHub repo → pick this repo. In the service's Settings set **Root Directory** to `backend` (`backend/railway.json` selects the Dockerfile and the `/actuator/health` check).
2. Settings → Networking → Generate Domain. Railway supplies `PORT` itself.
3. Variables (never commit them):
   - `SPRING_PROFILES_ACTIVE=prod`
   - `DATABASE_URL=jdbc:postgresql://<supabase-pooler-host>:5432/postgres?sslmode=require`, `DATABASE_USERNAME=postgres.<project-ref>`, `DATABASE_PASSWORD`
   - `JWT_SECRET` (`openssl rand -hex 48`), `COOKIE_SECURE=true`
   - `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` for the first start only, then delete them
4. In `frontend/vercel.json` add `{ "source": "/api/:path*", "destination": "https://<railway-domain>/api/:path*" }` before the catch-all rewrite, then redeploy Vercel.

## 8. Running production without Razorpay (demo only)
Set `ALLOW_PAYMENT_SIMULATION=true` instead of the Razorpay keys. The checkout then shows the "Simulate successful payment" button and **anyone can mark an order paid without paying**.
Use it only while there are no real customers; set the Razorpay keys and delete the variable before taking real orders. The API logs a warning at start-up while it is on.

## 9. Rider account
Set `RIDER_EMAIL` and `RIDER_PASSWORD` (at least 12 characters, optional `RIDER_NAME`) in the API's environment and start it. A rider with an online delivery profile is created if the email does not exist yet.
The vehicle details are left empty. Remove `RIDER_PASSWORD` afterwards; the account keeps working.
