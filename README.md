# Zestora — Modern Food Delivery & Quick-Commerce Platform

> **A fully original, production-grade, multi-actor food delivery and quick-commerce ecosystem serving Bhatkal & Coastal Karnataka.**

![Zestora Banner](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 What is Zestora?

Zestora is a complete, unified platform that connects **Customers** with the best local restaurants and grocery stores, **Restaurant Partners** with a live kitchen management hub, **Delivery Heroes** with their ride dispatch app, and **Platform Admins** with an enterprise operations command center — all in one unified Next.js ecosystem.

---

## ⚡ Quick Start (Demo Mode — No Database Required)

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open browser at
http://localhost:3000
```

> **Demo Mode** includes a fully reactive in-memory data store with seed restaurants, groceries, a delivery partner, and a seeded delivered order — letting you experience the complete 4-actor order lifecycle without PostgreSQL setup.

---

## 🎭 Multi-Actor Role Switcher (Top Demo Bar)

The **global role switcher bar** at the very top of every page lets you switch personas in one click:

| Role | Route | Description |
|------|-------|-------------|
| 👤 **Customer** | `/` | Browse restaurants & grocery, order food, track live delivery |
| 🍳 **Restaurant Partner** | `/restaurant-dashboard` | Accept/reject orders, manage menu, view settlement reports |
| 🛵 **Delivery Partner** | `/delivery-dashboard` | Toggle online status, accept pickups, confirm delivery |
| ⚡ **Admin** | `/admin` | Platform GMV, commission analytics, audit logs, zone management |

---

## 🔄 Complete End-to-End Demo Flow

1. **Customer** browses restaurants → selects "Spice Garden" → opens *Special Chicken Biryani* → customizes (Jumbo Pack + Extra Egg) → adds to cart
2. Applies coupon **`ZEST50`** at checkout → selects UPI payment → places order
3. **Switch to Restaurant Partner** → accepts order → marks Preparing → marks Ready for Pickup
4. **Switch to Delivery Partner** → accepts pickup request → confirms pickup → marks Delivered
5. **Switch back to Customer** → tracks real-time delivery → submits 5-star review → downloads printable PDF invoice
6. **Switch to Admin** → reviews updated GMV, commission, and audit log

---

## 📦 Technology Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Database ORM | Prisma (PostgreSQL) |
| State | React Context API |
| Demo Store | In-memory reactive class singleton |

---

## 🗂 Project Architecture

```
zestora/
├── app/                          # Next.js App Router pages & API
│   ├── page.tsx                  # Customer Homepage (Hero, Restaurants, Grocery, Coupons)
│   ├── layout.tsx                # Root Layout + CartProvider
│   ├── restaurants/              # Restaurant listing & detail pages
│   ├── grocery/                  # 10-20 min QuickMart grocery page
│   ├── checkout/                 # Checkout with coupon, tip, payment
│   ├── orders/                   # Order history & live tracking
│   ├── restaurant-dashboard/     # Restaurant Partner Kitchen Hub
│   ├── delivery-dashboard/       # Delivery Partner Driver App
│   ├── admin/                    # Platform Admin Command Center
│   ├── support/                  # Customer support & tickets
│   ├── offers/                   # Coupons & promo codes
│   └── api/v1/                   # REST API routes
│       ├── restaurants/          # GET, PATCH
│       ├── products/             # GET
│       ├── orders/               # GET, POST, PATCH/:id
│       ├── coupons/              # GET, POST /validate
│       ├── delivery/             # GET, POST (toggle online)
│       ├── reviews/              # GET, POST
│       ├── support/              # GET, POST
│       └── admin/metrics/        # GET (GMV, commission, audit logs)
│
├── components/                   # Shared UI components
│   ├── Navbar.tsx               # Sticky navbar with role switcher
│   ├── CartDrawer.tsx            # Slide-out cart with bill breakdown
│   ├── Footer.tsx               # Partner ecosystem links
│   ├── LocationModal.tsx         # Delivery zone picker
│   └── FoodCustomizationModal.tsx # Variants, toppings, instructions
│
├── server/                       # Backend services & data layer
│   ├── dataStore.ts             # Reactive singleton store (demo engine)
│   └── seedData.ts              # Seed restaurants, grocery, orders
│
├── lib/
│   ├── cartContext.tsx           # Cart state + pricing + role switcher
│   └── utils.ts                 # formatCurrency, cn, formatDateTime
│
├── types/index.ts                # Full TypeScript model definitions
├── prisma/schema.prisma          # 35+ production database models
├── tests/run-tests.js            # Automated test suite
└── .env.example                  # Environment variable template
```

---

## 🏗 Production Database Setup (PostgreSQL + Prisma)

```bash
# 1. Copy env file and configure DATABASE_URL
cp .env.example .env.local

# 2. Run database migrations
npm run db:migrate

# 3. Seed production data
npm run db:seed
```

---

## 🧪 Running Tests

```bash
npm test
```

Tests cover:
- ✅ Authoritative server-side pricing (Subtotal + Taxes + Fees - Discounts)
- ✅ Free delivery threshold rule (≥ ₹499)
- ✅ ZEST50 coupon validation (min order + max discount cap)
- ✅ Order state machine (legal vs illegal status transitions)
- ✅ Grocery inventory reservation (anti-overselling)

---

## 🌐 Available Pages

| Page | URL | Actor |
|------|-----|-------|
| Homepage & Discovery | `/` | Customer |
| Restaurant Listing | `/restaurants` | Customer |
| Restaurant Detail + Menu | `/restaurants/[slug]` | Customer |
| QuickMart Grocery | `/grocery` | Customer |
| Checkout | `/checkout` | Customer |
| Order History | `/orders` | Customer |
| Live Order Tracking | `/orders/[id]` | Customer |
| Favorites | `/favorites` | Customer |
| Coupons & Offers | `/offers` | Customer |
| Customer Support | `/support` | Customer |
| Restaurant Dashboard | `/restaurant-dashboard` | Restaurant Partner |
| Delivery Dashboard | `/delivery-dashboard` | Delivery Partner |
| Admin Command Center | `/admin` | Platform Admin |

---

## 🍽 Seed Data — Featured Restaurants in Bhatkal

| Restaurant | Cuisine | Rating | Delivery |
|-----------|---------|--------|----------|
| **Spice Garden** | North Indian • Tandoor | ⭐ 4.6 | 25–35 min |
| **Coastal Bites** | Coastal Seafood • Mangalorean | ⭐ 4.8 | 20–30 min |
| **Biryani House** | Authentic Dum Biryani | ⭐ 4.9 | 20–30 min |
| **Pizza Street** | Artisan Wood-Fired Pizza | ⭐ 4.7 | 25–35 min |
| **Burger Hub** | Smash Burgers • American | ⭐ 4.5 | 15–25 min |
| **Cafe Aroma** | Desserts • Beverages • Bakery | ⭐ 4.6 | 15–25 min |

---

## 🎟 Demo Coupon Codes

| Code | Type | Benefit |
|------|------|---------|
| `ZEST50` | 50% OFF | Up to ₹100 discount, min order ₹299 |
| `FREEDEL` | Free Delivery | Zero delivery fee, min order ₹199 |
| `WELCOME100` | ₹100 Flat OFF | On orders above ₹399 |

---

## 📄 License

MIT © Zestora Technologies — Original design, architecture & implementation.
