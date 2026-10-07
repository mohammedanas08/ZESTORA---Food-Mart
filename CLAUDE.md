# Zestora — Project Rules for Claude

This is an **independent project** (a friend's project, not the owner's personal work).

## Isolation rule
- Use **only** what is in this repository (code, `README.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `IDEA.md`, `API.md`, `DATABASE.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`) and what the user says in this project's chat.
- Do **not** read from, rely on, or write to Claude's personal/auto memory. Do not carry over preferences, facts or context from other projects or sessions.
- Project knowledge lives in the docs above. If something must be remembered, put it in `PROGRESS.md` or `ARCHITECTURE.md`, not in memory.

## Project stack
- **Backend (`backend/`):** Java 21 + Spring Boot 3.5 + PostgreSQL (local Docker, port 5433) + Flyway + Razorpay + Cloudinary. See `backend/README.md`.
- **Web app (`frontend/`):** React 18 + TypeScript + Vite + React Router + TanStack Query + Tailwind + STOMP. See `frontend/README.md`.
- **Target (planned production stack):** React.js (JS/TS) frontend; Java + Spring Boot backend; PostgreSQL or MySQL; Spring Data JPA/Hibernate; REST; Spring Security + JWT; WebSocket for real-time; Razorpay/Stripe payments; Google Maps/Mapbox; Cloudinary or AWS S3; Maven; JUnit + Mockito + React Testing Library.

## Working rules
- **No secrets in code, config files, seed data, tests or docs.** Credentials and keys come only from environment variables: `backend/.env` in development (git-ignored, template in `backend/.env.example`), real env vars in production. Tests generate random secrets (`TestSecrets`).
- Keep `PROGRESS.md` up to date after every meaningful change.
- Never commit real secrets; `.env.example` must only contain placeholders.

## Decisions already made (2026-10-07)
Rebuild backend in Spring Boot · PostgreSQL local via Docker for now (hosted DB later) · Razorpay only · Cloudinary · food + grocery in v1 · maps provider undecided.
Run backend tests with `cd backend && mvn test` (Docker Desktop must be running); frontend tests with `cd frontend && npm test`.
Local dev Postgres runs on port **5433** (`backend/docker-compose.yml`) because 5432 is often taken by a local install.

Bhatkal demo restaurants: `mvn spring-boot:run -Dspring-boot.run.profiles=dev,bhatkal` (places from OpenStreetMap, SAMPLE menus; logins in `backend/DEMO_ACCOUNTS.md`). Do not scrape Google Maps.
