# Allo Inventory Reservation System

A Next.js application implementing race-condition-safe inventory reservations for a multi-warehouse retail platform.

**Live demo**: https://inventory-management-system-h280jcmen.vercel.app/  
**Architecture doc**: [docs/architecture.md](./docs/architecture.md)

---

## What this does

When a customer proceeds to checkout, units are temporarily reserved for 10 minutes. If payment succeeds, the reservation is confirmed and inventory permanently decrements. If payment fails or the timer expires, the hold is released and units return to available stock.

This prevents both overselling (two customers buying the last unit) and false stock depletion (carts abandoned without reservations expiring).

---

## Local setup

### Prerequisites
- Node.js 18+
- A hosted PostgreSQL database (Supabase or Neon free tier)
- An Upstash Redis instance (free tier)

### Steps

```bash
git clone https://github.com/SAIKRISHNA2005/22MIS1081-inventory-reservation-system.git 
cd 22MIS1081-inventory-reservation-system
npm install

cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL (from Supabase/Neon dashboard)
# Fill in UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (from Upstash dashboard)

npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open http://localhost:3000

---

## Deploying to Vercel

### 1. Environment variables

In **Vercel → Project → Settings → Environment Variables**, set all of these for **Production** (and Preview if you use it):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Pooled URL — Supabase **Transaction pooler**, port **6543**, with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Direct URL — port **5432**, no `pgbouncer` param |
| `UPSTASH_REDIS_REST_URL` | From Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash dashboard |
| `CRON_SECRET` | Random string (`openssl rand -base64 32`) |

**Common mistake:** using the direct (5432) URL for both, or swapping `DATABASE_URL` and `DIRECT_URL`.

### 2. Run migrations and seed (once, from your machine)

Migrations are **not** run during Vercel build (Supabase often blocks port 5432 from build servers → `P1001`). Run these locally with production credentials in `.env`:

```bash
npm run db:migrate   # creates/updates tables
npm run seed         # loads products + inventory
```

Use **`DIRECT_URL`** in `.env` — from Supabase: **Connect → Session pooler → URI** (port **5432** on `*.pooler.supabase.com`), not the old `db.*.supabase.co` host if that fails.

Without migrate + seed, the app deploys but `/api/products` is empty or APIs error.

### 3. Redeploy after changing env vars

Vercel does not inject new env vars into an existing deployment. After adding or editing variables:

> Deployments → latest → **⋯** → **Redeploy**

### 4. Verify the deployment

Open:

```
https://YOUR-APP.vercel.app/api/health
```

- `{ "ok": true, "db": "connected", "productCount": 8 }` — database is wired correctly.
- `{ "ok": false, ... }` — read `hints` / `error` in the JSON and fix env URLs or run migrations/seed.

Check **Vercel → Logs** for `[api error] prisma P2024` (pool timeout) or `P1001` (can't reach host).

### Running the concurrency test
With the dev server running:
```bash
npm run test:concurrency
```
This fires 20 simultaneous reservation requests for the last unit of USB-C Hub (Mumbai warehouse) and asserts that exactly 1 succeeds and 19 receive 409.

---

## How reservation expiry works in production

Reservations use a **hybrid expiry strategy**:

**Lazy expiry (correctness layer)**: Every time a reservation is read — whether by the checkout page polling, or before a confirm/release action — the system checks `expiresAt < now`. If the reservation is expired and still PENDING, it is released automatically before the response is returned. This guarantees active users always see consistent state.

**Cron cleanup (eventual consistency layer)**: A Vercel Cron job runs every minute and calls `GET /api/cron/release-expired`, which bulk-releases all PENDING reservations past their `expiresAt`. This handles abandoned reservations where no further reads occur after the timer runs out.

---

## Trade-offs and what I'd change with more time

| Decision | Why | What I'd change at scale |
|---|---|---|
| No version field / optimistic locking | Conditional UPDATE is sufficient at this scale | Add a `version` int for high-contention SKUs + retry loop |
| Cron granularity = 1 minute | Acceptable for 10-min reservation window | Queue-based delayed jobs (BullMQ) for precise per-reservation expiry |
| No authentication | Out of scope for this exercise | JWT/session to bind reservations to a user, prevent cross-user confirms |
| No rate limiting | Out of scope | Rate limit POST /api/reservations by IP to prevent spam reservations |
| Synchronous reservation confirm | Simple and correct | At high volume, confirm via payment webhook queue (async) |
| Cron runs on every instance | Acceptable for single-region Vercel | Distributed lock or queue to prevent duplicate cleanup on multi-region |

## Things not implemented

- User authentication (reservations are anonymous)
- Payment provider integration (confirm is a direct button, not a webhook)
- Email notifications on reservation expiry
- Admin dashboard for inventory management

---

## Tech stack

Next.js 14 (App Router) · TypeScript · Prisma · PostgreSQL · Supabase · Upstash Redis · TanStack Query · Zod · Tailwind CSS · shadcn/ui · Vercel

---

## Screenshots

Captured from a local run at `http://localhost:3000` (desktop: 1440×900, mobile: iPhone 13 viewport).

### Desktop (1440×900)

**Products — `/products`**

![Desktop products page](./public/images/output/desktop-products.png)

**Reservation checkout — `/reservation/[id]` (pending, 10-minute timer)**

![Desktop reservation pending](./public/images/output/desktop-reservation-pending.png)

**Reservation confirmed — after Confirm purchase**

![Desktop reservation confirmed](./public/images/output/desktop-reservation-confirmed.png)

**Cancel reservation — blur toast overlay**

![Desktop cancel toast](./public/images/output/desktop-cancel-toast.png)

### Mobile (390×844, iPhone 13)

**Products — `/products`**

![Mobile products page](./public/images/output/mobile-products.png)

**Reservation checkout — `/reservation/[id]` (pending)**

![Mobile reservation pending](./public/images/output/mobile-reservation-pending.png)

**Reservation confirmed**

![Mobile reservation confirmed](./public/images/output/mobile-reservation-confirmed.png)

**Cancel reservation — blur toast overlay**

![Mobile cancel toast](./public/images/output/mobile-cancel-toast.png)
