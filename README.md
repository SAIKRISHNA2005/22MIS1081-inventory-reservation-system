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
