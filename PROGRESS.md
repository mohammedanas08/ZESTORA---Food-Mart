# Zestora — Project Progress

_Last reviewed: 2026-10-07 · Source: audit of the repository at commit `565606f` (branch `main`)._

Zestora is a multi-actor food delivery + quick-commerce platform for Bhatkal / Coastal Karnataka
(Customer, Restaurant Partner, Delivery Partner, Admin).

## 1. Where we are in one paragraph

Decisions are made: **Spring Boot backend, local PostgreSQL (Docker) for now, Razorpay, Cloudinary, maps later, food + grocery in v1.**
Both halves now exist and work together:

- `backend/`: Spring Boot API, **43 passing tests** (23 unit + 15 end-to-end + 5 WebSocket, on real PostgreSQL).
- `frontend/`: new **React + TypeScript** client for all four roles, **42 passing tests**, production build OK, phone layout audited.
- A full order was run in a real browser against the real backend: sign in, customise a dish, coupon, place order, pay (simulator),
  live status updates over WebSocket (about 1 s), rider pickup and delivery with the customer's code, admin totals, restaurant menu edit.

Rough completion: **Spring Boot backend ~65% · React client ~70% · Production readiness ~45%.**

Legend: ✅ done · 🟡 partial / demo-grade · ❌ not started

---

## 2. Backend (`backend/`)

| Area | Status | Detail |
|---|---|---|
| Project (Maven, Java 21, Spring Boot 3.5) | ✅ | `backend/pom.xml`, `application{,-dev,-prod}.yml`, `docker-compose.yml` for local Postgres |
| Schema + migrations (Flyway) | ✅ | `V1__core_schema.sql` (users, restaurants, products/variants/add-ons, orders, payments, coupons, riders, reviews, support, audit) and `V2` Row-Level-Security (harmless locally, protects the tables if a Supabase-style host is used later) |
| Auth: register/login/refresh/logout/me | ✅ | BCrypt, 15-min JWT, rotating hashed refresh token in httpOnly cookie, reuse detection, rate limit |
| RBAC + ownership (IDOR-safe) | ✅ | URL rules + per-order ownership checks, outsiders get 404 |
| Catalogue: food **and** grocery | ✅ | Public reads, partner menu editing, open/close |
| Pricing engine + coupons | ✅ | Server-authoritative; ZEST50 / FREEDEL / WELCOME100 seeded |
| Orders + state machine | ✅ | Role-aware transitions, history, delivery OTP, optimistic locking, 30-min unpaid expiry |
| Grocery stock safety | ✅ | Row lock at order time, released on cancel/expiry (tested) |
| Payments (Razorpay) | 🟡 | Checkout, HMAC verify, webhook with idempotency written and unit-tested; **not yet run against real Razorpay keys**. Dev simulator is dev-profile only |
| Rider dispatch | 🟡 | Auto-assign least-busy online rider + 15 s retry job; no distance-based matching yet |
| Reviews, support tickets | ✅ | Rating aggregation on restaurant |
| Admin (metrics, users, staff/restaurant/rider/coupon creation, audit logs) | ✅ | |
| WebSocket (STOMP) | ✅ | JWT-on-CONNECT, per-topic subscribe checks, no client SEND; 5 automated tests with real socket clients (rejection cases + live pushes to customer, kitchen, rider) |
| Cloudinary signed upload | 🟡 | Signing endpoint written; untested without real credentials |
| Real Bhatkal-area demo data | 🟡 | 13 real places from OpenStreetMap (Bhatkal, Murdeshwar, Byndoor, Honnavar) seeded by profile `bhatkal`, each with an owner login (`backend/DEMO_ACCOUNTS.md`). **Menus and prices are SAMPLES** (OpenStreetMap has none). No ratings invented. Coverage is limited by what OpenStreetMap lists; Google Maps is not scraped (its terms forbid it) |
| Local PostgreSQL (Docker, port 5433) | ✅ | Used for development and by the end-to-end tests (Testcontainers) |
| Hosted production database | ❌ | Not chosen yet (Supabase, Neon, RDS...). Only `DATABASE_URL/USERNAME/PASSWORD` change; see `backend/README.md` |
| Refunds / payouts / GST invoice | ❌ | Cancelled-after-paid orders are only flagged `REFUND_PENDING` |
| Notifications (FCM/SMS/email) | ❌ | |
| Maps | ❌ | Decision postponed; address lat/lng and rider lat/lng are already stored |
| Tests | ✅ | 23 unit + 15 end-to-end + 5 WebSocket (Testcontainers PostgreSQL); run `cd backend && mvn test` (Docker must be running) |

## 3. React client (`frontend/`)

| Area | Status | Detail |
|---|---|---|
| Auth (login, register, silent refresh, logout) | ✅ | Access token in memory, refresh cookie httpOnly, single shared refresh on 401 |
| Customer: browse, grocery, cart, checkout, coupons | ✅ | One-source cart, estimate vs server total, ZEST50 verified in browser |
| Customer: pay, live tracking, cancel, review, support | ✅ | Razorpay window wired (needs keys); dev simulator works; WebSocket live updates verified |
| Restaurant console: live orders, accept/prepare/ready/reject, menu, open/close | ✅ | Menu price edit verified in browser |
| Rider app: online toggle, jobs, pickup, delivery with code | ✅ | Wrong/short code blocked (verified) |
| Admin: overview, orders, users + staff creation, partners onboarding, coupons, audit log | ✅ | Totals verified in browser; link owner to restaurant and create rider profile screens (3 tests) |
| Role route guards | ✅ | Verified: rider opening `/admin` is sent back to `/rider` |
| Mobile / phone layout | ✅ | Bottom tab bar (customer, kitchen), sticky place-order bar at checkout, 44px tap targets, 16px inputs (no iOS zoom), safe-area padding, scrollable admin tabs. Audited at 375px on every screen: no sideways overflow, no small tap targets |
| Tests | ✅ | 42 (Vitest + React Testing Library) |
| Maps / live rider map | ❌ | Provider undecided |
| Cloudinary upload UI | ❌ | Signing endpoint exists; no upload widget yet |
| Notifications, PWA install, translations, accessibility audit, mobile polish | ❌ | |
| Razorpay real window | 🟡 | Written, not tried with real keys |

## 4. Known gaps and risks

- Real Razorpay payments have not been tried (needs your test keys); the simulator is used in development.
- Menus and prices in the demo data are samples; ratings are empty. Real partner menus are needed before launch.
- Refunds on cancelled paid orders are only flagged `REFUND_PENDING`; there is no payout ledger or GST invoice yet.
- Rate limiting and rider locations are in-memory (fine for one server; use Redis for several).
- Not yet tested on real phones, and no accessibility audit.
- An earlier commit contains a leaked-looking `NEXTAUTH_SECRET` and old demo passwords (git history). Treat them as burnt; do not reuse them.

## 5. Roadmap

### Phase 0: First prototype (Next.js): done and removed
- [x] The prototype was replaced by `backend/` + `frontend/`; its security issues were fixed first and are designed out of the new backend.
- [x] Legacy app deleted (2026-10-07), recoverable from git history.

### Phase 1: Spring Boot backend (core built, see section 2)
- [x] Schema + Flyway, auth/JWT, catalogue, pricing, coupons, orders, payments, dispatch, reviews, support, admin, WebSocket, media signing, tests.
- [x] Run against local PostgreSQL (Docker, port 5433).
- [ ] Pick a hosted PostgreSQL for staging/production and point `DATABASE_URL` at it.
- [x] WebSocket subscriptions tested automatically.
- [ ] Test Razorpay with real test-mode keys; configure the Razorpay webhook URL.
- [ ] Refunds on cancel-after-pay (Razorpay refund API) and a payout ledger.
- [ ] GST tax-invoice generation (PDF) and invoice numbering.

### Phase 2: React client on the new API (core done)
- [x] New React (TypeScript) app on `/api/v1`; access token in memory + silent refresh.
- [x] Customer flow (browse, cart, checkout, pay, live tracking via WebSocket), restaurant console, rider app, admin panel.
- [x] Component/unit tests (33) and a manual end-to-end run in a real browser.
- [ ] Cloudinary upload widget using `/media/sign` (dish and restaurant photos).
- [x] Admin screens for linking an owner to a restaurant and creating rider profiles (Partners tab).
- [ ] Real Razorpay window test with test keys.
- [x] Mobile layout polish (see 3c). Not yet tested on a physical phone or real iOS/Android browsers.
- [ ] Loading skeletons, empty-state art, accessibility audit (keyboard, screen reader, contrast).
- [ ] Automated browser tests (Playwright) for the full journey.

### Phase 3: Launch readiness
- [ ] Real restaurant coverage: either the official Google Places API (needs a Google Cloud key, billing) or collect partners by hand with the restaurants' own menus and prices; replace the sample menus with real ones as partners onboard.
- [ ] Maps provider decision (Google Maps vs Mapbox): address autocomplete, ETA, live rider map.
- [ ] Notifications (FCM push, SMS/email), restaurant and rider onboarding with KYC, support-agent console.
- [x] CI: GitHub Actions workflow (`.github/workflows/ci.yml`) runs backend `mvn verify` and frontend typecheck + tests + build. **Written but not yet seen running on GitHub**; check the Actions tab after the next push.
- [ ] Dockerfiles, staging environment, backups, monitoring/alerts.
- [ ] Redis for rate limiting / rider locations if running more than one instance.
- [ ] Pilot in Bhatkal with 5-10 restaurants.

---

## 6. Changelog

| Date | Change |
|---|---|
| 2025-09-21 → 2026-09-28 | Initial CRA scaffold → full Next.js platform (UI, store, APIs, Prisma schema, docs) |
| 2026-09-30 | Auth (login/register/logout/me), RBAC middleware, admin APIs |
| 2026-10-05 | Razorpay payment flow, `.env.example` rewritten |
| 2026-10-07 | Project isolation rule (`CLAUDE.md`), full audit, `PROGRESS.md`, `ARCHITECTURE.md`, `IDEA.md` |
| 2026-10-07 | Fixed the 4 critical security issues in the Next.js prototype (verified against the running app) |
| 2026-10-07 | Cleanup: removed dead backend code (2 unused queries, unused logger/import, unused commission config); moved ALL credentials to env (`backend/.env`, template `backend/.env.example`): DB user/password, JWT secret, one `DEMO_PASSWORD` for seeded accounts; no secret literals remain in code, config, seed data or tests (tests generate random secrets); docker-compose reads credentials from `.env`; dev database now on volume `zestora-db-data` |
| 2026-10-07 | Legacy Next.js app deleted at the owner's request (superseded by `backend/` + `frontend/`; recoverable from git history). Root README, DEPLOYMENT and CONTRIBUTING rewritten for the new stack |
| 2026-10-07 | Bhatkal-area demo data: `scripts/generate_bhatkal_seed.py` (OpenStreetMap, ODbL), `BhatkalDemoSeeder`, profile `bhatkal`, 13 restaurants with sample menus and owner logins |
| 2026-10-07 | Mobile polish: bottom tabs, sticky checkout bar, tap targets, input zoom fix; 6 new tests (frontend 42) |
| 2026-10-07 | Admin Partners screens, WebSocket integration tests (5), GitHub Actions CI. Backend 43 tests, frontend 36 tests |
| 2026-10-07 | Built the React client (`frontend/`), 33 tests; ran a full order end to end in a real browser. Added `GET /partner/restaurant` to the backend; dev Postgres moved to port 5433 |
| 2026-10-07 | Built the Spring Boot backend (`backend/`), 38 tests passing. The end-to-end test caught a PostgreSQL null-parameter bug in the search queries, now fixed |

_(Dates for earlier work are inferred from file timestamps and the two git commits.)_

---

## 7. Decisions

| Question | Decision (2026-10-07) |
|---|---|
| Backend direction | **Rebuild in Java Spring Boot** (done; the old Next.js app is removed) |
| Database | **Local PostgreSQL in Docker for now** (`backend/docker-compose.yml`, port 5433, Flyway migrations). Hosted database later; the original plan was Supabase, nothing in the code depends on it |
| Payments | **Razorpay** only |
| Maps | **Decide later** (Google Maps or Mapbox) |
| Image storage | **Cloudinary** |
| v1 scope | **Food and grocery both** (separate orders; one order cannot mix them) |

### Still open
1. Which hosted PostgreSQL for production (Supabase, Neon, AWS RDS...) and when to set it up.
2. Razorpay test keys + webhook secret.
3. Commission model: flat 20% (default) or per-restaurant (the column already exists per restaurant).
4. Should one restaurant have several staff accounts? (Today: one owner/manager user per restaurant.)
5. Mixed food + grocery in a single checkout (today the cart must be split into two orders).
6. Pilot partner and launch date.
