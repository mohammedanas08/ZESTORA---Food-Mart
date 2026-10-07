# Contributing to Zestora

## Setup
Follow the quick start in `README.md`. Backend tests need Docker running; they create their own PostgreSQL and random secrets, so no `.env` is required.

## Ground rules
- **No secrets in the repo.** Credentials and keys go in `backend/.env` (git-ignored) or environment variables. Update `backend/.env.example` with a placeholder when you add a variable. Tests must use `TestSecrets` (random per run), never literals.
- **Prices are computed on the server.** The client sends product ids and quantities only. Change pricing in `PricingEngine` and keep `frontend/src/lib/pricing.ts` (the checkout estimate) in step; both are covered by tests with the same numbers.
- **Order status changes go through `OrderStateMachine`** (who may set which status, and legal moves). Every order endpoint must also pass `OrderAccess` (ownership), so users cannot touch other people's orders.
- **Schema changes are new Flyway migrations** (`backend/src/main/resources/db/migration/V<next>__name.sql`). Never edit an applied migration: it changes its checksum and breaks existing databases.
- **Route guards in the React app are cosmetic.** Real permission checks belong in the backend (and need a test).

## Before you push
```bash
cd backend  && mvn verify
cd frontend && npm run typecheck && npm test && npm run build
```
CI runs the same checks. Keep `PROGRESS.md` up to date after meaningful changes.

## Demo data
`mvn spring-boot:run -Dspring-boot.run.profiles=dev,bhatkal` seeds the two real restaurants in `seed/curated-restaurants.json`. Add restaurants only with data you were given (names and prices exactly as supplied; leave unknown fields empty). Do not scrape Google Maps; use the official Places API with your own key.
