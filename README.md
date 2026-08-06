# Tranquillo Green

Cannabis accounting, compliance, and operations platform under Tranquillo Labs — a 280E-defensibility operating system for cannabis operators and their CPAs.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your keys (see below)
npm run dev
```

## Environment Variables

Create `.env.local` in the project root (never commit real keys — `.env*` files are gitignored):

```
# Clerk — https://dashboard.clerk.com (API Keys page)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex — from the Convex dashboard or `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk -> Convex auth bridge
CLERK_CONVEX_JWT_TEMPLATE=convex
CLERK_JWT_ISSUER_DOMAIN=https://your-instance.clerk.accounts.dev
```

See `.env.local.example` for the full list, including optional QuickBooks Online integration variables. Run `npm run env:check` to validate your configuration.

## Current Status

- Authenticated app shell: Clerk sign-in/sign-up, onboarding flow that creates real Convex company records, and tenant-aware dashboard layout
- Convex-backed system of record: chart of accounts, reporting periods, transactions and transaction lines, cash reconciliations, 280E/471(c) allocations, import jobs, and export packets
- Guided close workflow: readiness computed from live workflow state, review queues, and audit trail with actor/timestamp/reason metadata
- Import pipeline: persisted import jobs, mapping profiles, validation results, exception review, and promotion into transactions with lineage
- CPA leverage: export center and packet builder on persisted data, role-aware access (owner / controller / accountant / viewer)
- Integrations: QuickBooks Online OAuth flow (sandbox), POS connect panels (Square, Toast, Treez)
- Security hardening: auth-wrapped Convex functions, company-ownership checks on API routes, security headers, input validation (see `qa-security-review.md`)
- Sandbox/demo mode: auto-provisioned seeded demo org with guided product tour

## MVP Focus

Cannabis accounting/compliance wedge:
- chart of accounts
- transactions
- 280E allocation
- cash reconciliation
- inventory-to-books reconciliation
- filing calendar
- QuickBooks export

## Tech Stack

- Next.js 14 / React 18
- Tailwind CSS
- Convex (database + backend functions)
- Clerk (authentication)

## Commands

```bash
npm run dev        # local dev server
npm run build      # production build
npm run lint       # ESLint
npm test           # smoke tests (node test runner)
npm run env:check  # validate env configuration
```

## Clerk -> Convex setup

Before persisted accounting reads/writes will work, create a Clerk JWT template named `convex`:

1. In the Clerk dashboard, go to JWT Templates
2. Create a template named `convex`
3. Set audience / application ID to `convex`
4. Use your Clerk instance's issuer domain

Then ensure `.env.local` includes:
- `CLERK_CONVEX_JWT_TEMPLATE=convex`
- `CLERK_JWT_ISSUER_DOMAIN=https://your-instance.clerk.accounts.dev`

The same `CLERK_JWT_ISSUER_DOMAIN` must be set on the Convex deployment (`convex/auth.config.ts` reads it) so Convex can validate Clerk-issued tokens.

## Seed Convex demo org (optional)

If `NEXT_PUBLIC_CONVEX_URL` is set, you can seed the demo company used by the accounting workspace:

```bash
# From the running app
curl -X POST http://localhost:3000/api/accounting/seed -H "Content-Type: application/json" -d "{}"
```

The response includes a summary of seeded records (accounts, periods, transactions, reconciliations, import jobs).

## Key Docs

- `docs/TRANQUILLO_GREEN_OVERVIEW.md` — project overview and design system
- `docs/2026-04-04-green-phased-execution-roadmap.md` — strategic roadmap
- `docs/2026-04-04-github-backlog.md` — execution backlog
- `docs/2026-04-04-green-schema-and-route-map.md` — schema and route map
- `docs/2026-04-11-operator-walkthrough.md` — operator walkthrough
- `qa-security-review.md` / `qa-onboarding-audit.md` — QA audit records
