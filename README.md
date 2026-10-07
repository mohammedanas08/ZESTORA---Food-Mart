# Zestora

A hyperlocal **food delivery and quick-commerce (grocery) platform** for Bhatkal and the Karnataka coast.
Four connected experiences in one product: **customers**, **restaurant partners**, **delivery riders** and **admins**.

| Part | Folder | Stack |
|---|---|---|
| API | [`backend/`](backend/README.md) | Java 21, Spring Boot 3.5, Spring Security + JWT, JPA/Hibernate, Flyway, PostgreSQL, WebSocket (STOMP), Razorpay, Cloudinary |
| Web app | [`frontend/`](frontend/README.md) | React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS |
| Tooling | [`scripts/`](scripts/) | Demo-data generator (OpenStreetMap, Bhatkal area) |
| CI | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Backend `mvn verify` + frontend typecheck, tests, build |

Docs: [IDEA](IDEA.md) (what and why) · [ARCHITECTURE](ARCHITECTURE.md) (design and workflows) · [PROGRESS](PROGRESS.md) (status and roadmap) ·
[DEPLOYMENT](DEPLOYMENT.md) · [CONTRIBUTING](CONTRIBUTING.md)

## Quick start (development)

Prerequisites: Java 21, Maven, Node 20+, Docker.

```bash
# 1. Backend settings: copy the template and set the values (the file is git-ignored)
cd backend
cp .env.example .env            # PowerShell: Copy-Item .env.example .env
#    edit .env: DATABASE_PASSWORD, JWT_SECRET (>= 32 random chars), DEMO_PASSWORD

# 2. Database (PostgreSQL in Docker, port 5433) and API (http://localhost:8080)
docker compose up -d
mvn spring-boot:run -Dspring-boot.run.profiles=dev,bhatkal   # drop ",bhatkal" for the small made-up sample data

# 3. Web app (http://localhost:5173), in a second terminal
cd ../frontend
npm install
npm run dev
```

Sign in with the demo accounts listed in [`backend/README.md`](backend/README.md#demo-logins-dev-profile-only-never-seeded-in-production)
and [`backend/DEMO_ACCOUNTS.md`](backend/DEMO_ACCOUNTS.md); they all use the `DEMO_PASSWORD` you put in `backend/.env`.
Without Razorpay keys the payment step offers a "simulate payment" button.

## Tests
```bash
cd backend  && mvn test      # unit + end-to-end + WebSocket tests on a real PostgreSQL (Docker must be running)
cd frontend && npm test      # component and unit tests
```

## Secrets
No secret lives in the code. Development uses `backend/.env` (git-ignored); production uses real environment variables.
See [`backend/.env.example`](backend/.env.example) for the full list.

## Data sources
Restaurant places in the demo data come from OpenStreetMap contributors (ODbL, https://www.openstreetmap.org/copyright).
**Menus and prices in the demo data are samples, not real.**
