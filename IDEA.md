# Zestora — The Idea

## One-liner
A hyperlocal food delivery and quick-commerce platform for **Bhatkal and Coastal Karnataka**, built for
local restaurants, local riders and local customers — with fair commission, coastal cuisine and
10–20 minute grocery.

## The problem
- National apps (Swiggy / Zomato) charge restaurants 25–30%+ commission, and small-town restaurants
  often have no presence at all.
- Small towns have weak coverage: few riders, long waits, little local cuisine discovery
  (Bhatkali biryani, Mangalorean seafood, coastal snacks).
- Local grocery stores have no quick-delivery channel.
- Town-scale restaurants have no simple tool to manage orders, menus and payouts.

## The solution
One platform, four connected apps:

| Actor | What they get |
|---|---|
| **Customer** | Browse local restaurants and QuickMart grocery, customise food, pay by UPI, track the order live, review, reorder |
| **Restaurant partner** | A kitchen hub: live orders, menu and stock control, transparent commission and payouts |
| **Delivery partner** | A rider app: online toggle, job offers, step-by-step delivery, clear earnings (100% of tips) |
| **Admin** | Command centre: GMV, commission, coupons, zones/surge, users, audit trail, support |

## Why it can win locally
1. **Lower commission** (default 20%, negotiable) → restaurants keep more.
2. **Local-first catalogue** — coastal and Bhatkali food as the hero, not an afterthought.
3. **Dense, small delivery radius** → short ETAs (15–35 min) without a huge fleet.
4. **Food + grocery in one cart** → more orders per customer, better rider utilisation.
5. **Trust** — server-side pricing, verified payments, audit logs, honest fees.

## Customer promise
- Transparent bill: subtotal + packaging + delivery + platform fee + 5% GST + tip − coupon.
- Free delivery above ₹499. Coupons such as `ZEST50`, `FREEDEL`, `WELCOME100`.
- Live tracking and a printable tax invoice.

## Business model
| Revenue stream | How |
|---|---|
| Commission | ~20% of restaurant food value (configurable) |
| Platform fee | Flat ₹5 per order |
| Delivery fee | ₹40 within 5 km (rider pay is funded from this + incentives) |
| Packaging fee | ₹15 on food orders |
| Later | Featured listings / ads, surge pricing, subscription (free delivery pass), grocery margin |

Rider earnings = base fee + distance incentive + peak bonus + 100% tips.

## Target users
- **Customers:** students, working professionals and families in Bhatkal, Murdeshwar, Honnavar, Kumta (expand along the coast).
- **Restaurants:** independent restaurants, biryani houses, cafes, bakeries.
- **Riders:** local part-time and full-time two-wheeler owners.

## MVP scope (v1)
Customer ordering + UPI payment · restaurant order handling · rider delivery flow · admin metrics and coupons ·
reviews and support tickets · grocery (QuickMart) catalogue.

## Not in v1
Subscriptions, loyalty points, multi-city, restaurant ads, scheduled orders, group orders, AI recommendations.

## Future ideas
- Live map tracking and smart rider assignment (nearest + load balanced).
- Demand-based surge pricing and rain/peak bonuses.
- Subscription pass (free delivery) and loyalty wallet.
- Cloud-kitchen / "Zestora Originals" brands.
- Restaurant analytics (best sellers, peak hours) and inventory alerts.
- Multilingual UI (English, Kannada, Urdu/Konkani).
- Eco-packaging badge (already seeded in support content: biodegradable boxes).

## Success metrics
Orders per day · average delivery time · restaurant retention · repeat-customer rate (30-day) ·
average order value · rider utilisation · cancellation rate · rating (food / packaging / delivery).

## Risks
- Marketplace cold start (need restaurants *and* riders *and* customers at once) → launch with a small curated set.
- Thin margins and rider cost in a low-density town → tight radius, bundled grocery.
- Payment fraud / abuse → server-side pricing, verified webhooks, role-based access (see PROGRESS.md §4).
- Regulatory: FSSAI for partners, GST invoicing, rider labour rules.

## Current state
A working Spring Boot API and React web app cover all four actors (customer, restaurant, rider, admin) with demo data around Bhatkal.
See `PROGRESS.md` for status and `ARCHITECTURE.md` for the design.
