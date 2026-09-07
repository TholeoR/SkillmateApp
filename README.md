# Skillmate — two-sided marketplace

A low-budget, EU-friendly marketplace platform built with Next.js (App Router,
TypeScript), PostgreSQL, MinIO (S3-compatible), Supabase auth, and Mollie
payments.

## Stack

| Concern      | Choice                                              |
| ------------ | --------------------------------------------------- |
| Frontend     | Next.js 16 (React, TypeScript, Tailwind)            |
| Frontend/API | Next.js App Router + Route Handlers                 |
| Database     | PostgreSQL 16 (Docker) + Prisma ORM                 |
| Storage      | MinIO (Docker, S3-compatible)                       |
| Auth         | Supabase (EU region)                                |
| Payments     | Mollie (Netherlands)                                |
| Search       | PostgreSQL `pg_trgm` (PostgreSQL built-in extension)|

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
| `MOLLIE_API_KEY`                    | Mollie payment API key           |
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
    api/                 # Route handlers: listings, search, checkout, mollie webhook
    auth/                # Sign in / sign up
    listings/            # Browse, view, create listings
    checkout/success/    # Order confirmation
    profile/             # Buyer/seller dashboard
    search/              # Search results
  components/            # Client components (forms, buttons, search)
  lib/
    prisma.ts            # Prisma client singleton (pg adapter)
    storage.ts           # MinIO client + bucket helpers
    mollie.ts            # Mollie payment client
    supabase/            # Supabase clients (browser, server, proxy)
  proxy.ts               # Auth cookie refresh (Next.js "middleware")
```

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start dev server                     |
| `npm run build`  | Production build                     |
| `npm run lint`   | Run ESLint                           |
| `npx prisma studio` | Browse the database              |