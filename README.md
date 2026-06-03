# Barber-Shop

Online booking platform connecting clients in Yerevan with **barber shops** and **independent barbers** — discover providers, see real-time availability, and book appointments.

Working name: **Sapor**. Domain: **barber-shop.am**. Hosted on **Vercel**.

> This is the project skeleton. Business logic is built feature-by-feature in the order described in [`docs/03-architecture-and-api.md`](docs/03-architecture-and-api.md) §13.

## Stack

- **Next.js (App Router)** + **TypeScript** + **SCSS** — UI and API routes in one app
- **PostgreSQL** via **Prisma**
- **Redis** (caching; Upstash in prod)
- **pnpm** package manager
- **Docker Compose** for local Postgres + Redis

## Prerequisites

- Node.js 20+ (`.nvmrc` pins 20)
- pnpm 9+ (`corepack enable` then `corepack prepare pnpm@9 --activate`, or install directly)
- A free **Neon** Postgres database — https://neon.com (no local database software needed)

> Prefer a fully local database instead of Neon? Install Docker Desktop and use the
> [Local Postgres with Docker](#local-postgres-with-docker-alternative) path below.

## Getting started (Neon)

```bash
# 1. Install dependencies
pnpm install

# 2. Environment — create .env from the template
cp .env.example .env
```

3. Create a project at **neon.com**, then copy two connection strings into `.env`:
   - `DATABASE_URL` → Neon's **pooled** connection string (host contains `-pooler`)
   - `DIRECT_URL` → Neon's **direct** connection string (used for migrations)

   Both end with `?sslmode=require`. Neon shows them under *Connect* / *Connection string*.

```bash
# 4. Create the database schema
pnpm prisma migrate deploy  # applies prisma/migrations
pnpm prisma generate        # generates the typed client

# 5. Run the app
pnpm dev                    # http://localhost:3000
```

6. (optional) Seed Yerevan districts: open the **SQL Editor** in the Neon dashboard,
   paste the contents of `prisma/seed.sql`, and run. (No `psql` install required.)

Health check: `GET http://localhost:3000/api/health` → `{ "status": "ok" }`.

### Local Postgres with Docker (alternative)

If you'd rather run the database on your machine:

```bash
docker compose up -d        # starts Postgres + Redis
# use the localhost URLs shown in .env.example, then:
pnpm prisma migrate deploy && pnpm prisma generate
psql "postgresql://barber:barber@localhost:5432/barber_shop" -f prisma/seed.sql
pnpm dev
```

## Scripts

| Command | Does |
|---------|------|
| `pnpm dev` | Run the app in dev mode |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint (next/core-web-vitals) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier write |
| `pnpm db:migrate` | Create/apply a dev migration |
| `pnpm db:deploy` | Apply migrations (CI/prod) |
| `pnpm db:studio` | Prisma Studio |

## Project structure

```
app/                 # Next.js App Router (UI + app/api/* route handlers)
  api/health/        # liveness probe
lib/                 # shared server logic (db client, later: auth, services)
prisma/
  schema.prisma      # source of truth for the database
  migrations/        # SQL migrations (0001_init creates all tables)
  seed.sql           # Yerevan districts
docs/                # product + technical specification (00-03)
docker-compose.yml   # local Postgres + Redis
.github/workflows/   # CI: lint, typecheck, build
```

## Database notes

- UUID PKs (`gen_random_uuid()`), all timestamps `timestamptz` (UTC), money as whole AMD integers.
- The **no-double-booking** guarantee is a Postgres GiST `EXCLUDE` constraint on `bookings` (requires `btree_gist`; **PostgreSQL 13+**). Prisma can't express it, so it lives in the raw SQL of `0001_init`.
- The init migration was hand-written and verified against the PostgreSQL grammar parser. After your first `prisma migrate`, you can confirm it's drift-free with:
  ```bash
  pnpm prisma migrate diff --from-migrations prisma/migrations \
    --to-schema-datamodel prisma/schema.prisma --exit-code
  ```

## Auth

Email + password auth with our own JWT. Access + refresh tokens are stored in
**httpOnly cookies**; refresh tokens rotate on every use and revoke the whole
chain if a used token is replayed (reuse detection). Roles (`customer`,
`barber`, `shop_owner`, `admin`) live in `user_roles` and are embedded in the
access token; guard routes with `requireAuth` / `requireRole` from
`lib/auth/rbac.ts`.

Endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create account (`role`: customer/barber/shop_owner), logs in |
| POST | `/api/auth/login` | Email + password |
| POST | `/api/auth/refresh` | Rotate tokens (uses the refresh cookie) |
| POST | `/api/auth/logout` | Revoke refresh token, clear cookies |
| GET | `/api/me` | Current user (requires auth) |
| GET | `/api/provider/ping` | Demo role-guarded route (barber/shop_owner only) |

Smoke test (dev server must be running):

```bash
bash scripts/smoke-auth.sh
```

**Frontend:** the client data layer uses **RTK Query** (`lib/store/`) — the api
slice (`lib/store/api.ts`) exposes hooks (`useMeQuery`, `useLoginMutation`,
`useRegisterMutation`, `useLogoutMutation`) and auto-refreshes the session on a
`401`. `/login` and `/register` pages use React Hook Form + the shared Zod
schemas; the header reflects auth state via `useMeQuery`.

> After pulling auth changes, run `pnpm install` (new deps: `jose`,
> `@node-rs/argon2`, `@reduxjs/toolkit`, `react-redux`, `react-hook-form`,
> `@hookform/resolvers`) and `pnpm prisma migrate deploy && pnpm prisma generate`
> (new `refresh_tokens` table).

## Deploying to Vercel

1. Import the GitHub repo in Vercel (it auto-detects Next.js + pnpm).
2. Set env vars (`DATABASE_URL`, `DIRECT_URL`, etc.) from a managed Postgres (Neon/Supabase).
3. Point `barber-shop.am` DNS (at name.am) to Vercel.

See [`docs/03-architecture-and-api.md`](docs/03-architecture-and-api.md) §2 for the full hosting plan.

## Documentation

- [`docs/00-naming.md`](docs/00-naming.md) — name options
- [`docs/01-product-spec.md`](docs/01-product-spec.md) — features, MVP scope, roadmap, monetization
- [`docs/02-data-model.md`](docs/02-data-model.md) — schema + ERD
- [`docs/03-architecture-and-api.md`](docs/03-architecture-and-api.md) — API, RBAC, scheduling, notifications, security
