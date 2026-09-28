# Zestora Production Deployment Guide

This guide describes how to deploy the Zestora food delivery and quick-commerce platform to cloud environments such as Vercel, AWS, or Docker/Kubernetes with a PostgreSQL database.

---

## 1. Prerequisites

- **Node.js**: v18.17.0+ or v20+
- **PostgreSQL Database**: v14+ (hosted on Supabase, Neon, AWS RDS, or Railway)
- **Environment Configuration**: Set up according to `.env.example`

---

## 2. Environment Variables

Configure the following environment variables in your deployment dashboard (e.g. Vercel Project Settings):

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/zestora?sslmode=require"

# Next.js App
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_APP_NAME="Zestora"
NEXT_PUBLIC_APP_CITY="Bhatkal"
NEXT_PUBLIC_PLATFORM_COMMISSION_RATE=0.20

# Optional Payment Gateway
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_live_secret"
```

---

## 3. Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Set the Framework Preset to **Next.js**.
4. Set the Root Directory to `./` or `zestora/` depending on your repository layout.
5. Add the environment variables specified in `.env.example`.
6. Click **Deploy**.

---

## 4. Docker Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

---

## 5. Automated CI/CD Health Checks

Ensure the following passes on every PR:
```bash
# Run unit & integration tests
npm test

# Run production build
npm run build
```
