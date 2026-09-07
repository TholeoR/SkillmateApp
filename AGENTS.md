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
- Auth: Supabase (EU) — code wired, keys not yet configured
- Payments: Mollie — code wired, API key not yet configured
- GitHub repo: `TholeoR/SkillmateApp` (private), pushed on `main`

## Current status (session 2026-09-07) — ALL COMPLETE
- Node 22.23.2 via nvm; Docker Engine 29.8 + Compose v5 installed in WSL
- Project scaffolded, `docker compose up -d` → postgres + minio both healthy
- Prisma migrated (`migrate dev`), seeded (`prisma db seed`)
- API routes: `/api/listings` (CRUD + MinIO upload), `/api/search` (pg_trgm),
  `/api/checkout` (Mollie), `/api/mollie/webhook`
- Pages: `/`, `/search`, `/listings/[id]`, `/listings/new`, `/auth`, `/profile`,
  `/checkout/success`
- Auth cookie refresh via `src/proxy.ts` (Next.js 16 renamed middleware → proxy; thrown when Supabase keys absent, so not-yet-configured is fine unless a proxied call errors vanish — see notes)
- Verified: `npm run build` and `npm run lint` pass; dev server renders seeded listing at `/`

## Environment notes
- Dev server: `npm run dev` (http://localhost:3000) — restart with `bash -lc` if gone:
  `cd ~/projects/skillmate && setsid nohup npm run dev >/tmp/opencode/skillmate-dev.log 2>&1 &`
- Docker on WSL: `docker compose up -d` works only from a fresh `wsl.exe` login OR
  after `newgrp docker` since `sg`/`newgrp` binaries may be absent; the tool session
  relaunches group membership per `bash -lc` — if `docker ps` says permission denied,
  use: `wsl.exe -d Ubuntu -- bash -lc 'docker compose up -d'`
- `nvm` node: must source `export NVM_DIR=~/.nvm; . "$NVM_DIR/nvm.sh"` before node/npm
  (Windows node also on PATH and can shadow)

## Next steps (pending user keys)
1. Supabase: create project (EU region), put `NEXT_PUBLIC_SUPABASE_URL` +
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` into `.env` → auth becomes active (sign up/in, profile upsert)
2. Mollie: create test API key → `/api/checkout` works; webhook only valid via public URL (use `ngrok` or deploy for real webhook tests)
3. Then iterate MVP: real product data, image upload e2e test, order flow validation
4. Later: deploy (Vercel free / Hetzner), email (Brevo/Mailjet), Meilisearch when >10k listings

## Reminders for agent
- `.env` is gitignored; `.env.example` committed. Never commit real keys.
- Prisma 7 CLI: commands via `node_modules/.bin/prisma` (migration path + seed defined in `prisma.config.ts`)
- Read `node_modules/next/dist/docs/` before assuming Next.js 16 API conventions.
