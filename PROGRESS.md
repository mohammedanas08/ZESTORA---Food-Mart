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
| Udupi Deluxe – Pure Veg Restaurant | ✅ | 236 menu items / 22 categories from the owner's typed menu (Kannada names not stored), pure-veg badge, storefront photo (222 px), owner login, search + Pure veg filter, cart and checkout verified. **Still unknown and left empty:** town, address, phone, opening hours, rating, delivery info. Butter Scotch scoop price conflict (100 / 110) unresolved |
| Layali Arabia Restaurant (real menu) | ✅ | 102 items / 12 categories transcribed from the restaurant's own menu photos; 17 seafood items are "SEASONAL" with no price. **Not available, so left empty:** address, opening hours, rating, contact, delivery time, cover photo, per-dish photos. City is set to Bhatkal as the app's service area: please confirm. Logo is a small crop of the menu cover: replace with the real logo file |
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
| 2026-10-07 | **Production readiness**: prod-profile jar tested (refuses to start without payment keys, simulator closed, health UP). Fixed a start-up failure on PostgreSQL servers that reject the legacy time zone name `Asia/Calcutta`. New `backend/scripts/transfer-restaurants.sh` copies only the three restaurants, menus and owner logins to an empty hosted database (tested end to end on a throw-away database, the prod jar then booted on the copy and all three owners logged in). `README.md` rewritten in detail; Vercel notes in `DEPLOYMENT.md`. Backend 51 tests, frontend 49 tests, build OK |
| 2026-10-07 | **UI redesign** from the supplied "Foody" reference: warm cream background, red pill buttons, Playfair Display headings with Poppins body, new header (search and cart icons, mobile drawer plus the existing bottom tabs), editorial home hero, large restaurant cards (logo or monogram, rating, pure-veg badge, local-only favourites), cuisine and pure-veg filter chips, offers from the real coupon list, menu page with sticky search, veg filter and category chips, dish cards with quantity stepper, restyled cart/checkout/auth, About and Contact routes, footer with real links only. No dish photos exist, so none are shown; a dish or restaurant gets its photo as soon as its image is supplied. Logic, API and roles unchanged. Frontend 49 tests, build OK |
| 2026-10-07 | **The Royal Olives Restaurant** added from the supplied menu: 193 items / 25 categories, names, prices, categories, Vegetarian labels and descriptions verified identical to the paste by an independent parse; 105 veg, 88 non-veg (unlabelled items are all chicken/mutton/prawn/squid/crab). Town "Bhatkal" comes only from the menu's own wording; address, phone, hours, rating, delivery info unverifiable (web search found only look-alikes) and left empty. Exterior photo supplied earlier by the owner; no food photos. Backend 51 tests |
| 2026-10-07 | **Only two restaurants remain** (Udupi Deluxe, Layali Arabia) at the owner's request. Removed from the database: the 6 made-up samples and the 13 OpenStreetMap places (19 restaurants, 166 dishes, 14 owner logins; nothing had orders or reviews). Removed from the repo: the OpenStreetMap seed file and its generator script. The `bhatkal` profile now seeds only the two; the made-up samples are off in it (new `seed-sample-restaurants` flag, still on for tests). Backend 50 tests |
| 2026-10-07 | Menus are now shown in each restaurant's own order (the order dishes were added) instead of alphabetically, so e.g. Udupi Deluxe opens with South Indian Breakfast (Idly 1/2/3, Rava Idly, Vada, Idly Vada combos) instead of burying it at position 17 of 22. Two new tests. Backend 49 tests |
| 2026-10-07 | Udupi Deluxe menu loaded from the owner's typed menu: 236 items in 22 categories (all veg), names/prices exactly as supplied, duplicates merged, the 18 milk shakes that print "add ice cream Rs 20 extra" got an "Add ice cream +₹20" option. Butter Scotch scoop has two different printed prices (100 / 110) so it shows "Price on request". Seeder now also fills the menu of an existing restaurant that has none (never touches one that has dishes). Tests: backend 48, frontend 49 |
| 2026-10-07 | **Udupi Deluxe – Pure Veg Restaurant** added (pure veg, storefront photo, owner login) with everything unverified left empty: no address/town, phone, hours, rating, description, delivery info or menu (the 8 supplied menu photos are 112x112 px and unreadable). Added a "Pure Veg" badge and an "menu not added yet" notice in the UI. Not taken from the Bengaluru listing. Tests: backend 48, frontend 49 |
| 2026-10-07 | **Layali Arabia Restaurant** added with its REAL menu (102 items, 12 categories) transcribed from the menu photos; seeded from `curated-restaurants.json`. New migration `V3` makes product `price` and `veg` optional (unknown is stored as NULL, never invented); unpriced items show "Price on request" and cannot be ordered; logo shown on cards and the restaurant page; unknown delivery time / minimum order are hidden. Tests: backend 47, frontend 46 |
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
