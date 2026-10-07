# Demo restaurant accounts (development only)

Created by the `bhatkal` seed profile from `src/main/resources/seed/curated-restaurants.json`. Each restaurant owner signs in at the app with the email
below and the `DEMO_PASSWORD` from your `backend/.env`, and lands on the kitchen console (orders + menu). The emails are fake (`@zestora.local`);
nothing is sent to any real business.

| Restaurant | Menu | Email |
|---|---|---|
| Layali Arabia Restaurant | 102 items in 12 categories, transcribed from its printed menu | `layali-arabia-restaurant@zestora.local` |
| Udupi Deluxe – Pure Veg Restaurant | 236 items in 22 categories, from the menu text supplied by the owner | `udupi-deluxe-pure-veg-restaurant@zestora.local` |
| The Royal Olives Restaurant | 193 items in 25 categories, exactly as supplied (105 labelled Vegetarian) | `the-royal-olives-restaurant@zestora.local` |

These are the only three restaurants in the app. The other demo accounts (customer, rider, admin) are listed in `backend/README.md`.
Local development only. Never run the `bhatkal` profile against a production database.
