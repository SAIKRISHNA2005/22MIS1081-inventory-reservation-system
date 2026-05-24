# Inventory Reservation System

A multi-warehouse inventory reservation system built with Next.js 14, TypeScript, PostgreSQL, Prisma, and Redis.

The project is focused on handling inventory reservations safely under concurrent checkout scenarios while maintaining accurate stock availability across warehouses.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis (Upstash)
- TanStack Query
- Tailwind CSS
- shadcn/ui
- Zod

## Project Status

Completed:
- Initial application scaffolding and development infrastructure setup
- Architecture notes for reservation lifecycle and concurrency strategy
- Added Prisma schema defining Product, Warehouse, Inventory, and Reservation models
- Added idempotent seed script populating two warehouses, three products, and realistic initial inventory levels
- Implemented GET /api/products and GET /api/warehouses endpoints
- Built product listing page with stock per warehouse and reserve action
- Implemented atomic stock reservation with PostgreSQL conditional UPDATE
- Added concurrency script proving exactly one reservation succeeds for the last unit
- Implemented reservation confirmation endpoint that permanently decrements inventory on payment success
- Implemented reservation release endpoint that returns reserved units back to available pool
- Added hybrid expiry strategy combining lazy cleanup on GET reads with Vercel Cron background bulk release
- Built reservation checkout page with real-time countdown timer and reservation action controls
- Added optimistic UI updates, error boundary handling, and automatic post-action state synchronization
- Added Upstash Redis-based idempotency protection for reservation and confirmation endpoints to prevent duplicate request processing
- Refactored reservation logic into a dedicated service layer, centralized API error handling, and cleaned up route implementations for improved maintainability and consistency

## Development

Install dependencies:

```bash id="g5m8v1"
npm install
```

Start the development server:

```bash
npm run dev
```

Environment Variables

Create a .env.local file using .env.example as reference.
