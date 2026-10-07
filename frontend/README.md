# Zestora Frontend (React)

React 18 · TypeScript · Vite · React Router · TanStack Query · Tailwind CSS · STOMP over WebSocket · Vitest + React Testing Library.

One app, four experiences chosen by the signed-in role:

| Role | Routes |
|---|---|
| Visitor / Customer | `/` restaurants, `/restaurants/:id`, `/grocery`, `/cart`, `/checkout`, `/orders`, `/orders/:id` (live tracking, pay, cancel, review), `/support` |
| Restaurant owner / manager | `/partner` (live kitchen orders), `/partner/menu` (prices, sold-out, add dish, open/close) |
| Rider | `/rider` (online toggle, assigned jobs, pickup → delivered with the customer's 4-digit code) |
| Admin / Super admin | `/admin` (overview, orders, users + staff creation, coupons, audit log) |

## Run
```bash
# terminal 1: database + API (see ../backend/README.md)
cd ../backend && docker compose up -d && mvn spring-boot:run

# terminal 2: this app on http://localhost:5173
npm install
npm run dev
```
Vite proxies `/api` and `/ws` to `http://localhost:8080` (override with `VITE_BACKEND_URL`), so the browser only talks to one origin
in development; no CORS setup is needed and the `SameSite=Strict` refresh cookie works.

Demo logins (backend dev profile): `customer@zestora.com / customer123`, `spicegarden@zestora.local / rest123`,
`rahul.rider@zestora.local / rider123`, `admin@zestora.com / admin123`.

## Scripts
`npm run dev` · `npm run build` (typecheck + production build) · `npm test` · `npm run typecheck`

## How it talks to the backend
- **Auth:** the short-lived access token is kept **in memory only**. The refresh token is an httpOnly cookie the browser sends
  automatically. On page load the app silently calls `/auth/refresh` to restore the session; on a `401` the API client refreshes once
  (shared between concurrent requests) and retries. See `src/api/client.ts`.
- **Prices:** the client never sends prices or totals, only product ids, quantities and options. The checkout screen shows an
  *estimate* (`src/lib/pricing.ts`); the order page shows the server's figures.
- **Cart:** one source per cart (a single restaurant, or grocery). Adding from another source asks to start a new cart.
- **Real time:** `useStompTopic` subscribes to `/topic/order/{id}` (customer), `/topic/restaurant/{id}/orders` (kitchen),
  `/user/queue/jobs` (rider), `/topic/admin/live` (admin). Pages also poll as a fallback.
- **Payments:** `PaymentPanel` starts checkout on the server and opens Razorpay's checkout window; the signature is verified by the
  backend. Without server keys (dev) it offers a "simulate payment" button instead.
- **Route guards** (`RequireRole`) are only for convenience; the backend enforces every permission.

## Tests (33)
`src/api/client.test.ts` (refresh/retry, in-memory token), `src/cart/CartContext.test.tsx`, `src/lib/pricing.test.ts`
(same numbers as the backend), `src/pages/pages.test.tsx` (guards, login, browse, checkout payload, order page, tracker).

## Not built yet
Maps / live rider position on a map (provider undecided), push notifications, admin UI for linking owners to restaurants and creating
rider profiles (API exists), PDF invoices, refunds UI, Kannada/Urdu translations, PWA install for the rider app.
