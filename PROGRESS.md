# Zestora — Project Progress

_Last reviewed: 2026-10-07 · Source: audit of the repository at commit `565606f` (branch `main`)._

Zestora is a multi-actor food delivery + quick-commerce platform for Bhatkal / Coastal Karnataka
(Customer, Restaurant Partner, Delivery Partner, Admin).

## 1. Where we are in one paragraph

Decisions are made: **Spring Boot backend, local PostgreSQL (Docker) for now, Razorpay, Cloudinary, maps later, food + grocery in v1.**
Both halves now exist and work together:

- `backend/`: Spring Boot API, **38 passing tests** (23 unit + 15 end-to-end on real PostgreSQL).
- `frontend/`: new **React + TypeScript** client for all four roles, **33 passing tests**, production build OK.
- A full order was run in a real browser against the real backend: sign in, customise a dish, coupon, place order, pay (simulator),
  live status updates over WebSocket (about 1 s), rider pickup and delivery with the customer's code, admin totals, restaurant menu edit.

The old Next.js app is now legacy (its four critical security holes are fixed, but it can be retired once the React app is accepted).
**Not yet done:** choosing and connecting a hosted database for production, real Razorpay test keys, maps, notifications, refunds/payouts,
PDF invoices, CI/CD, deployment.

Rough completion: **Spring Boot backend ~65% · React client ~70% · Production readiness ~45%.**

Legend: ✅ done · 🟡 partial / demo-grade · ❌ not started

---

## 2. Feature progress by actor

### Customer
| Feature | Status | Notes |
|---|---|---|
| Home, restaurant list, restaurant detail + menu | ✅ | `app/page.tsx`, `app/restaurants/**` |
| Grocery / QuickMart page | ✅ | `app/grocery/page.tsx` |
| Food customization (variants, add-ons, instructions) | ✅ | `FoodCustomizationModal.tsx` |
| Cart drawer + live bill breakdown | ✅ | `lib/cartContext.tsx`, `CartDrawer.tsx` |
| Checkout (address, coupon, tip, payment choice) | ✅ | `app/checkout/page.tsx` |
| Payment page (Razorpay QR/UPI + simulate) | 🟡 | Test mode; simulate endpoint is unauthenticated |
| Order history + live tracking page | 🟡 | Tracking is polling (3 s) with a *simulated* driver position; no real GPS/map |
| Reviews, favorites, offers, support tickets, profile | ✅ | Pages exist; favorites/profile persistence is demo-level |
| Printable invoice | 🟡 | Browser print view, not a stored GST invoice |
| Login / signup | 🟡 | See auth in section 3 |
| Saved addresses, order again, wallet, loyalty | ❌ | |
| Push / SMS / email notifications | ❌ | Firebase keys only in `.env.example` |

### Restaurant Partner
| Feature | Status | Notes |
|---|---|---|
| Live order queue (accept / reject with reason / preparing / ready) | 🟡 | Works; polls every 3 s; no audio alert verified |
| Menu management (availability, price, prep time) | 🟡 | In-memory only |
| Settlement / commission view | 🟡 | Computed from in-memory orders |
| Open/close toggle | ✅ | `updateRestaurantStatus` |
| Onboarding / KYC / bank details / operating hours UI | ❌ | Tables exist in Prisma only |
| Role-gated access to the dashboard | ❌ | Not protected by `middleware.ts` |

### Delivery Partner
| Feature | Status | Notes |
|---|---|---|
| Online/offline toggle | ✅ | |
| Incoming job, pickup → delivered steps | 🟡 | Polling; assignment is simple, no matching algorithm |
| Earnings summary | 🟡 | Single seeded partner |
| Real GPS, navigation, proof of delivery, OTP handover | ❌ | |
| Role-gated access to the dashboard | ❌ | Not protected by `middleware.ts` |

### Admin
| Feature | Status | Notes |
|---|---|---|
| Metrics (GMV, commission, active orders/drivers/restaurants) | ✅ | `/api/v1/admin/metrics` |
| Users / products / orders management | 🟡 | `/api/admin/*` routes, `requireAdmin` |
| Coupons, service areas, audit logs | 🟡 | Read/create in store; audit log is in-memory |
| Surge / zone configuration, refunds, payouts, support-agent console | ❌ | |

---

## 3. Platform / backend progress

| Area | Status | Detail |
|---|---|---|
| Order state machine (PLACED → … → DELIVERED / CANCELLED) | ✅ | Enforced in `dataStore.ts` + `PATCH /api/v1/orders/[id]` |
| Server-side pricing (GST 5%, fees, free delivery ≥ ₹499) | ✅ | Authoritative in `createOrder` |
| Coupon validation (`ZEST50`, `FREEDEL`, `WELCOME100`) | ✅ | |
| Grocery stock reservation | 🟡 | Logic in store; tested only via a re-implementation (see tests) |
| REST API (`/api/v1/*`, `/api/auth/*`, `/api/payments/*`, `/api/admin/*`) | 🟡 | ~30 routes; two overlapping API surfaces (`/api/*` and `/api/v1/*`) |
| Razorpay service (create order, HMAC verify, webhook verify) | 🟡 | Implemented; mock fallback when no keys |
| Auth | 🟡 | Cookie login/register/logout/me; **demo-grade** (section 4) |
| RBAC | 🟡 | Middleware guards `/admin` + customer pages; API checks via `requireAdmin` |
| Database (Next.js prototype) | ❌ | Prisma schema never connected; superseded by the Spring Boot + Flyway schema below |
| Migrations / real seeding | ❌ | `npm run db:seed` points to `server/seedRunner.js`, which does not exist |
| Real-time (WebSocket) | ❌ | Polling every 3–4 s instead |
| Maps / geolocation | ❌ | Key placeholder only |
| Image storage (Cloudinary / S3) | ❌ | Images are Unsplash URLs |
| Notifications | ❌ | |
| Tests | 🟡 | `npm test` passes 5 checks that **re-implement** the logic instead of importing real code |
| CI/CD, Docker, deployment | ❌ | `DEPLOYMENT.md` is a guide only |
| Docs | ✅ | README, API, DATABASE, DEPLOYMENT, CONTRIBUTING, ARCHITECTURE, IDEA, PROGRESS |

---

### 3b. New Spring Boot backend (`backend/`)

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
| WebSocket (STOMP) | 🟡 | Written with JWT-on-CONNECT and per-topic subscribe checks; **no automated test yet** |
| Cloudinary signed upload | 🟡 | Signing endpoint written; untested without real credentials |
| Local PostgreSQL (Docker, port 5433) | ✅ | Used for development and by the end-to-end tests (Testcontainers) |
| Hosted production database | ❌ | Not chosen yet (Supabase, Neon, RDS...). Only `DATABASE_URL/USERNAME/PASSWORD` change; see `backend/README.md` |
| Refunds / payouts / GST invoice | ❌ | Cancelled-after-paid orders are only flagged `REFUND_PENDING` |
| Notifications (FCM/SMS/email) | ❌ | |
| Maps | ❌ | Decision postponed; address lat/lng and rider lat/lng are already stored |
| Tests | ✅ | 23 unit + 15 end-to-end (Testcontainers PostgreSQL); run `cd backend && mvn test` (Docker must be running) |

### 3c. React client (`frontend/`)

| Area | Status | Detail |
|---|---|---|
| Auth (login, register, silent refresh, logout) | ✅ | Access token in memory, refresh cookie httpOnly, single shared refresh on 401 |
| Customer: browse, grocery, cart, checkout, coupons | ✅ | One-source cart, estimate vs server total, ZEST50 verified in browser |
| Customer: pay, live tracking, cancel, review, support | ✅ | Razorpay window wired (needs keys); dev simulator works; WebSocket live updates verified |
| Restaurant console: live orders, accept/prepare/ready/reject, menu, open/close | ✅ | Menu price edit verified in browser |
| Rider app: online toggle, jobs, pickup, delivery with code | ✅ | Wrong/short code blocked (verified) |
| Admin: overview, orders, users + staff creation, coupons, audit log | ✅ | Totals verified in browser |
| Role route guards | ✅ | Verified: rider opening `/admin` is sent back to `/rider` |
| Tests | ✅ | 33 (Vitest + React Testing Library) |
| Maps / live rider map | ❌ | Provider undecided |
| Cloudinary upload UI | ❌ | Signing endpoint exists; no upload widget yet |
| Admin UI to link owners to restaurants / create rider profiles | ❌ | API exists (`POST /admin/restaurants`, `/admin/riders`) |
| Notifications, PWA install, translations, accessibility audit, mobile polish | ❌ | |
| Razorpay real window | 🟡 | Written, not tried with real keys |

## 4. Known issues & risks (audit findings)

These were found by reading the code; they have not been exploit-tested.

### Critical — FIXED on 2026-10-07 (prototype), and designed out in the Spring Boot backend

Verified against the running Next.js app: forged admin cookie gives 401/redirect, anonymous orders/payments give 401, a customer cannot set DELIVERED, wrong password gives 401. What was found and fixed:
1. **Forgeable session.** `zestora_token` is just the user's ID and `zestora_role` is a plain, non-`httpOnly` cookie
   (`app/api/auth/login/route.ts`). Middleware trusts the role cookie, so anyone can set cookies by hand
   and become admin. → **Fixed:** HMAC-signed, expiring, `httpOnly` session token (`server/session.ts`); the role is read from the server-side user record.
2. **Passwords are not hashed.** `server/passwordUtils.ts` stores `hashed:<plaintext>`. → **Fixed:** scrypt with a per-user salt (Spring Boot uses BCrypt).
3. **Unauthenticated order access.** `GET /api/v1/orders` returns **all** orders when no user is logged in, and
   `PATCH /api/v1/orders/[id]` shows no auth check in the code read — anyone could change an order status. → **Fixed:** auth required; per-role ownership rules for list/get/patch; CANCELLED can no longer bypass the state machine after pickup.
4. **Payment can be faked.** `POST /api/payments/simulate` and `/payments/create` have no auth; anyone can mark any order
   `PAID`. → **Fixed:** all payment routes need auth + ownership; `simulate` is owner-only and disabled in production.

### High
5. FIXED: `.env.example` contained a real-looking `NEXTAUTH_SECRET`; replaced with a placeholder (rotate the old value if it was ever used). `SESSION_SECRET` added.
6. Data is in memory — all orders, users and menu edits vanish on restart; not safe across multiple server instances.
7. FIXED: dashboards had no role protection; now guarded in `middleware.ts`.
8. No input validation layer (`server/validators`, `server/repositories`, `server/modules` folders exist but are empty).
9. No rate limiting, CSRF protection, or security headers.

### Medium / quality
10. The Next.js tests still do not exercise the real code (the Spring Boot backend has real tests).
11. Duplicate API surfaces (`/api/orders` vs `/api/v1/orders`, `/api/products` vs `/api/v1/products`).
12. README documents a "role switcher bar" that is replaced in practice by real login; docs and code have drifted slightly.
13. `db:seed` script is broken (missing file). `next-env.d.ts` is git-ignored but present.
14. `NEXTAUTH_*` variables are listed but NextAuth is not used.

---

## 5. Roadmap

### Phase 0: Stabilise the prototype (critical items done)
- [x] Signed sessions, password hashing, order/payment authorization, role-gated dashboards, clean `.env.example`.
- [ ] (Optional, low value now) fix the 4 pre-existing TypeScript errors in `app/admin/page.tsx` and `server/dataStore.ts`.

### Phase 1: Spring Boot backend (core built, see 3b)
- [x] Schema + Flyway, auth/JWT, catalogue, pricing, coupons, orders, payments, dispatch, reviews, support, admin, WebSocket, media signing, tests.
- [x] Run against local PostgreSQL (Docker, port 5433).
- [ ] Pick a hosted PostgreSQL for staging/production and point `DATABASE_URL` at it.
- [ ] Test WebSocket subscriptions; test Razorpay with real test-mode keys; configure the Razorpay webhook URL.
- [ ] Refunds on cancel-after-pay (Razorpay refund API) and a payout ledger.
- [ ] GST tax-invoice generation (PDF) and invoice numbering.

### Phase 2: React client on the new API (core done)
- [x] New React (TypeScript) app on `/api/v1`; access token in memory + silent refresh.
- [x] Customer flow (browse, cart, checkout, pay, live tracking via WebSocket), restaurant console, rider app, admin panel.
- [x] Component/unit tests (33) and a manual end-to-end run in a real browser.
- [ ] Cloudinary upload widget using `/media/sign` (dish and restaurant photos).
- [ ] Admin screens for linking an owner to a restaurant and creating rider profiles.
- [ ] Real Razorpay window test with test keys.
- [ ] Mobile layout polish, loading skeletons, empty-state art, accessibility audit.
- [ ] Automated browser tests (Playwright) for the full journey.

### Phase 3: Launch readiness
- [ ] Maps provider decision (Google Maps vs Mapbox): address autocomplete, ETA, live rider map.
- [ ] Notifications (FCM push, SMS/email), restaurant and rider onboarding with KYC, support-agent console.
- [ ] Dockerfile, CI (Maven build + tests + front-end tests), staging environment, backups, monitoring/alerts.
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
| 2026-10-07 | Built the React client (`frontend/`), 33 tests; ran a full order end to end in a real browser. Added `GET /partner/restaurant` to the backend; dev Postgres moved to port 5433 |
| 2026-10-07 | Built the Spring Boot backend (`backend/`), 38 tests passing. The end-to-end test caught a PostgreSQL null-parameter bug in the search queries, now fixed |

_(Dates for earlier work are inferred from file timestamps and the two git commits.)_

---

## 7. Decisions

| Question | Decision (2026-10-07) |
|---|---|
| Backend direction | **Rebuild in Java Spring Boot** (Next.js kept only as the current UI until the React client is ready) |
| Database | **Local PostgreSQL in Docker for now** (`backend/docker-compose.yml`, port 5433, Flyway migrations). Hosted database later; the original plan was Supabase, nothing in the code depends on it |
| Payments | **Razorpay** only |
| Maps | **Decide later** (Google Maps or Mapbox) |
| Image storage | **Cloudinary** |
| v1 scope | **Food and grocery both** (separate orders; one order cannot mix them) |

### Still open
0. Retire the legacy Next.js app once the React client is accepted? (it still contains the old UI)
1. Which hosted PostgreSQL for production (Supabase, Neon, AWS RDS...) and when to set it up.
2. Razorpay test keys + webhook secret.
3. Commission model: flat 20% (default) or per-restaurant (the column already exists per restaurant).
4. Should one restaurant have several staff accounts? (Today: one owner/manager user per restaurant.)
5. Mixed food + grocery in a single checkout (today the cart must be split into two orders).
6. Pilot partner and launch date.
