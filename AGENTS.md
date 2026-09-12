<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: Skillmate marketplace

Two-sided marketplace (buyers + sellers). Low-budget, EU-focused. This file is
auto-loaded by opencode at session start, so keep status here to resume work.

## Stack (all decided)
- Next.js 16 (App Router, TypeScript, Tailwind) — WSL, repo lives in `~/projects/skillmate`
- PostgreSQL 16 + MinIO via `docker-compose.yml` (local docker compose)
- Prisma ORM 7 (client generated to `src/generated/prisma`, driver adapter `@prisma/adapter-pg`)
- Search: PostgreSQL `pg_trgm` extension (migration `prisma/migrations/20260907000000_pg_trgm`)
- Auth: Supabase (EU) — keys in `.env`, auth live (sign-up → session → profile upsert verified)
- Payments: SumUp — codeswapped from Mollie (no registered company needed), sandbox keys in `.env`
- GitHub repo: `TholeoR/SkillmateApp` (private), pushed on `main`

## Current status (session 2026-09-12) — SUPABASE AUTH + SUMUP CHECKOUT VERIFIED
- Node 22.23.2 via nvm; Docker Engine 29.8 + Compose v5 installed in WSL
- Project scaffolded, `docker compose up -d` → postgres + minio both healthy
- Prisma migrated (`migrate dev`), seeded (`prisma db seed`)
- API routes: `/api/listings` (CRUD + MinIO upload), `/api/search` (pg_trgm),
  `/api/checkout` (SumUp), `/api/sumup/webhook`
- Pages: `/`, `/search`, `/listings/[id]`, `/listings/new`, `/auth`, `/profile`,
  `/checkout/success`
- Auth cookie refresh via `src/proxy.ts` (Next.js 16 renamed middleware → proxy)
- **Supabase auth VERIFIED end-to-end:** keys live in `.env`; sign-up on `/auth` creates a
  session and the `/profile` upsert writes a `users` row (real Supabase UUID). `npm run lint`
  + `npm run build` pass with keys live and proxy route active (build lists `ƒ Proxy`).
- Known gap: `/profile` writes `users` only; the `profiles` table exists in the schema but
  is not written anywhere yet (future work if profiles become user-facing).
- **Payments = SumUp (sandbox):** Mollie required a registered company, so payment code was
  swapped to SumUp Hosted Checkout (`@sumup/sdk`). `/api/checkout` creates an order + SumUp
  checkout (`hosted_checkout.enabled`, `checkout_reference: orderId`, `redirect_url` →
  `/checkout/success`, `return_url` → webhook). `/api/sumup/webhook` handles
  `CHECKOUT_STATUS_CHANGED`, verifies via `checkouts.get(id)` (SumUp's security model — always
  re-fetch checkout, no shared secret), then order PAID / listing SOLD or order CANCELLED.
  Verified: lint + build pass; **e2e sandbox checkout VERIFIED end-to-end**: `npm run e2e:checkout`
  creates a SumUp hosted-checkout for an ACTIVE listing (test card `4200 0000 0000 0091`, any name/
  future expiry/CVV). Paid checkout → SumUp reports checkout `PAID`; local webhook simulation
  (`POST /api/sumup/webhook` with `event_type: CHECKOUT_STATUS_CHANGED` + `id`) flipped order
  `cmty2obcg0000eoxsn3i8vo5m` PENDING → PAID and listing `demo-listing-1` ACTIVE → SOLD.
  Amounts `11.00`/`42.01` etc. trigger failures. Live switch = change API key to a live
  merchant key.

## Environment notes
- Dev server: `npm run dev` (http://localhost:3000) — restart with `bash -lc` if gone:
  `cd ~/projects/skillmate && setsid nohup npm run dev >/tmp/opencode/skillmate-dev.log 2>&1 &`
- Docker on WSL: `docker compose up -d` works only from a fresh `wsl.exe` login OR
  after `newgrp docker` since `sg`/`newgrp` binaries may be absent; the tool session
  relaunches group membership per `bash -lc` — if `docker ps` says permission denied,
  use: `wsl.exe -d Ubuntu -- bash -lc 'docker compose up -d'`
- `nvm` node: must source `export NVM_DIR=~/.nvm; . "$NVM_DIR/nvm.sh"` before node/npm
  (Windows node also on PATH and can shadow)

## Next steps
1. Iterate MVP: real product data, image upload e2e test, order flow validation
2. Later: deploy (Vercel free / Hetzner), email (Brevo/Mailjet), Meilisearch when >10k listings
   Note: real webhook delivery needs a public URL (tunnel like ngrok, or deployment); while
   local, simulate the event by POSTing `{"event_type":"CHECKOUT_STATUS_CHANGED","id":<checkoutId>}`
   to `/api/sumup/webhook` after paying.

## Reminders for agent
- `.env` is gitignored; `.env.example` committed. Never commit real keys.
- Prisma 7 CLI: commands via `node_modules/.bin/prisma` (migration path + seed defined in `prisma.config.ts`)
- Read `node_modules/next/dist/docs/` before assuming Next.js 16 API conventions.
