# Contributing to Zestora

Thank you for contributing to the Zestora Food Delivery & Quick-Commerce ecosystem!

---

## 1. Development Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-username/zestora.git
cd zestora

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to interact with the platform.

---

## 2. Code Architecture & Guidelines

- **Next.js App Router**: Route segments live in `app/`. Use client components (`'use client'`) only when interactive state, effects, or browser APIs are required.
- **Design System & Tailwind**: Follow the Zestora color palette (brand saffron `#FF6B00`, emerald green `#059669`, warm neutrals) and typography tokens defined in `tailwind.config.js`.
- **State & Pricing**: Authoritative order pricing must always be calculated through `dataStore.ts` / server logic. Do not calculate net payable totals solely on the client.
- **Order State Machine**: Any modifications to order status progression must adhere to the transitions defined in `types/index.ts` and validated in `server/dataStore.ts`.

---

## 3. Pull Request Checklist

Before submitting a PR:
1. Ensure all automated tests pass:
   ```bash
   npm test
   ```
2. Ensure the production build completes without errors or type warnings:
   ```bash
   npm run build
   ```
3. Test your changes across all relevant actor dashboards using the top role switcher bar.
