# Tranquillo Green

Cannabis accounting, compliance, and operations platform.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your keys (see below)
npm run dev
```

## Environment Variables

Create `.env.local` in the project root:

```
# Clerk — https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Z3JhbmQtd2FsbGFieS0yNy5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_vMgw5Ws4GTJn7UFUvxQxaPW5FyyRNQRmDTrQMfJi3Z

# Clerk routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://wandering-seahorse-373.convex.cloud

# Clerk -> Convex auth bridge
CLERK_CONVEX_JWT_TEMPLATE=convex
CLERK_JWT_ISSUER_DOMAIN=https://grand-wallaby-27.clerk.accounts.dev
```

---

Cannabis accounting, compliance, and operations platform under Tranquillo Labs.

Current repo status:
- Phase 1 scaffold for the accounting/compliance MVP
- Exact schema plan and route map documented in `docs/`
- Static dashboard shell and module pages scaffolded
- Convex schema skeleton for cannabis domain tables

## MVP Focus
California-first accounting/compliance wedge:
- chart of accounts
- transactions
- 280E allocation
- cash reconciliation
- inventory-to-books reconciliation
- filing calendar
- QuickBooks export

## Tech Stack
- Next.js 14
- React 18
- Tailwind CSS
- Convex schema skeleton
- Clerk-ready dependency included for later auth wiring

## Getting Started
```bash
npm install
npm run dev
npm run build
```

## Clerk -> Convex setup
Before persisted accounting reads/writes will work, create a Clerk JWT template named `convex`.

Clerk dashboard steps:
1. Go to JWT Templates
2. Create template named `convex`
3. Audience / application ID: `convex`
4. Use your Clerk issuer domain (for this project: `https://grand-wallaby-27.clerk.accounts.dev`)

Then ensure `.env.local` includes:
- `CLERK_CONVEX_JWT_TEMPLATE=convex`
- `CLERK_JWT_ISSUER_DOMAIN=https://grand-wallaby-27.clerk.accounts.dev`

## Seed Convex demo org (optional)
If NEXT_PUBLIC_CONVEX_URL is set, you can seed the demo company used by the accounting workspace:

```bash
# From the running app
curl -X POST http://localhost:3000/api/accounting/seed -H "Content-Type: application/json" -d "{}"
```

The response includes a summary of seeded records (accounts, periods, transactions, reconciliations, import jobs).

## Key Docs
- `docs/2026-04-04-green-schema-and-route-map.md`
- `docs/2026-04-04-green-phase-1-implementation-plan.md`
