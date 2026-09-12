# Skillmate — two-sided marketplace

A low-budget, EU-friendly marketplace platform built with Next.js (App Router,
TypeScript), PostgreSQL, MinIO (S3-compatible), Supabase auth, and SumUp
payment.

## Stack

| Concern      | Choice                                              |
| ------------ | --------------------------------------------------- |
| Frontend     | Next.js 16 (React, TypeScript, Tailwind)            |
| Frontend/API | Next.js App Router + Route Handlers                 |
| Database     | PostgreSQL 16 (Docker) + Prisma ORM                 |
| Storage      | MinIO (Docker, S3-compatible)                       |
| Auth         | Supabase (EU region)                                |
| Payments     | SumUp hosted checkout (sandbox; EU)                    |
| Search       | PostgreSQL `pg_trgm` (PostgreSQL built-in extension)|

## Tools & services

Each third-party tool/service used in this project, what it does, and why it
was chosen.

### Framework & languages

| Tool | Role in this project | Why / notes |
| ---- | -------------------- | ----------- |
| [Next.js 16](https://nextjs.org) | Web framework: App Router pages + API route handlers in one codebase | Boring, well-known React stack; server components keep it low-maintenance |
| [TypeScript](https://www.typescriptlang.org) | Static typing for all app code | Catches errors at build time |
| [Tailwind CSS](https://tailwindcss.com) | Styling | Utility-first, no CSS framework files to maintain |
| [Node 22 LTS](https://nodejs.org) via [nvm](https://github.com/nvm-sh/nvm) | Runtime for dev tools + Prisma CLI | Pinned locally to keep versions reproducible |

### Infrastructure (local, via Docker)

| Tool | Role in this project | Why / notes |
| ---- | -------------------- | ----------- |
| [PostgreSQL 16](https://www.postgresql.org) | Primary database | Every listing, user, order lives here |
| [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) | Fuzzy text search over listings | Built into Postgres — no separate service until >10k listings |
| [MinIO](https://min.io) | S3-compatible object storage for listing images | Self-hosted S3; swap endpoint to AWS/S3 later without code changes |
| [Docker Compose](https://docs.docker.com/compose/) | Runs Postgres + MinIO locally (`docker-compose.yml`) | `docker compose up -d` is the whole local infra |

### ORM & migration

| Tool | Role in this project | Why / notes |
| ---- | -------------------- | ----------- |
| [Prisma ORM 7](https://www.prisma.io) | Type-safe DB client, schema (`prisma/schema.prisma`), migrations | Client generated to `src/generated/prisma`; driver adapter `@prisma/adapter-pg`; CLI config in `prisma.config.ts` |

### Third-party SaaS

| Tool | Role in this project | Why / notes |
| ---- | -------------------- | ----------- |
| [Supabase](https://supabase.com) | Authentication (sign-up/sign-in, sessions) | Hosted in EU; keys in `.env`. The project's own `users`/`profiles` tables store profile data |
| [SumUp](https://developer.sumup.com) | Payments: hosted checkouts + webhook verification | Sandbox keys in `.env`; no registered company needed to take payments; SumUp's security model = re-fetch checkout (no shared secret) |
| [GitHub](https://github.com/TholeoR/SkillmateApp) | Private repo + git remote | `main` branch pushed from this repo |

### Dev tooling

| Tool | Role in this project | Why / notes |
| ---- | -------------------- | ----------- |
| [ESLint](https://eslint.org) + `eslint-config-next` | Linting | `npm run lint` |
| [tsx](https://github.com/privatenumber/tsx) | Runs TypeScript scripts directly | Powering `npm run e2e:checkout` (`e2e-sumup.ts`) |
| [dotenv](https://github.com/motdotla/dotenv) | Loads `.env` into Node scripts | Used by scripts outside Next.js |
| [Prisma Studio](https://www.prisma.io/studio) | Browser DB inspection | `npx prisma studio` |

Anything not listed here (e.g. the `minio` npm client, `@supabase/ssr`,
`@sumup/sdk`) is an SDK for the service above it.

## Prerequisites

- Node.js 20+ (project uses Node 22 LTS via nvm)
- Docker Engine + Compose plugin
- Git

## Setup

1. Start local infrastructure (PostgreSQL + MinIO):

   ```bash
   docker compose up -d
   ```

2. Install dependencies and generate the Prisma client:

   ```bash
   npm install
   npx prisma generate
   ```

3. Create the database schema and seed demo data:

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Configure environment (see `.env.example`):

   ```bash
   cp .env.example .env
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## Environment variables

| Variable                            | Purpose                          |
| ----------------------------------- | -------------------------------- |
| `DATABASE_URL`                      | PostgreSQL connection string     |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase project URL             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Supabase anon (public) key       |
| `MINIO_ENDPOINT` / `MINIO_PORT`     | MinIO endpoint + port            |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | MinIO credentials           |
| `MINIO_BUCKET`                      | MinIO bucket for listing images  |
| `SUMUP_API_KEY`                    | SumUp payment API key (sandbox)       |
| `SUMUP_MERCHANT_CODE`              | SumUp merchant code                   |
| `SUMUP_API_HOST`                   | Optional SumUp API host override      |
| `NEXT_PUBLIC_APP_URL`               | Public app URL (webhooks/redirects) |

The `docker-compose.yml` uses dev-only credentials
(`skillmate_dev`, `minioadmin_dev`). Change them before any real deployment.

## Project layout

```
prisma/
  schema.prisma          # Prisma data model (User, Profile, Listing, Image, Order)
  migrations/            # SQL migrations incl. pg_trgm extension
  seed.ts                # Demo seller + listing
src/
  app/
    api/                 # Route handlers: listings, search, checkout, sumup webhook
    auth/                # Sign in / sign up
    listings/            # Browse, view, create listings
    checkout/success/    # Order confirmation
    profile/             # Buyer/seller dashboard
    search/              # Search results
  components/            # Client components (forms, buttons, search)
  lib/
    prisma.ts            # Prisma client singleton (pg adapter)
    storage.ts           # MinIO client + bucket helpers
    sumup.ts            # SumUp payment client
    supabase/            # Supabase clients (browser, server, proxy)
  proxy.ts               # Auth cookie refresh (Next.js "middleware")
```

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start dev server                     |
| `npm run build`  | Production build                     |
| `npm run lint`   | Run ESLint                           |
| `npm run e2e:checkout` | Create a SumUp sandbox test checkout    |
| `npx prisma studio` | Browse the database              |

## Testing payments (SumUp sandbox)

1. Start the dev server, then create a test checkout:

   ```bash
   npm run e2e:checkout
   ```

   This picks the first listing (reactivating it if SOLD), creates an `Order`,
   and prints a SumUp hosted-checkout URL.

2. Open the URL and pay with a SumUp test card: `4200 0000 0000 0091`
   (any name, any future expiry, any 3-digit CVV). Amounts like `11.00` or
   `42.01` trigger failures.

3. The SumUp webhook needs a public URL, so locally you must simulate the
   event after paying:

   ```bash
   curl -X POST http://localhost:3000/api/sumup/webhook \
     -H 'Content-Type: application/json' \
     -d '{"event_type":"CHECKOUT_STATUS_CHANGED","id":"<checkoutId>"}'
   ```

   The webhook re-fetches the checkout from SumUp (their security model —
   no shared secret), so it only changes anything if the payment actually
   succeeded. On a PAID checkout the order becomes `PAID` and the listing
   `SOLD`; on FAILED/EXPIRED the order becomes `CANCELLED`. In production
   (app deployed), SumUp delivers the event directly and no simulation is
   needed.