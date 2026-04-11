# Tranquillo Green

Cannabis accounting, compliance, and 280E defensibility OS under Tranquillo Labs.

## What It Is

A full-stack accounting platform built for cannabis operators, controllers, and CPAs:

- **280E defensibility** — allocation review, CPA handoff, COGS intelligence, audit trail with actor/reason/history on every override
- **Import pipeline** — CSV import jobs with mapping profiles, validation, promote-to-transactions workflow
- **Month-end close** — computed close dashboard from live workflow state, reconciliation tie-outs
- **CPA export center** — packet builder with generation history, checklist snapshots, bundle status tracking
- **Multi-tenant auth** — Clerk authentication with role-based access (owner/controller/accountant/viewer)

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend:** Convex (real-time database, serverless functions)
- **Auth:** Clerk v5 (JWT bridge to Convex)
- **CI:** GitHub Actions (lint, typecheck, build)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.local.example .env.local
# Edit .env.local with your Convex URL and Clerk keys

# 3. Validate env vars
npm run env:check

# 4. Start dev server
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server-only) |
| `CLERK_JWT_ISSUER_DOMAIN` | No | Clerk JWT issuer (auto-detected) |
| `CLERK_CONVEX_JWT_TEMPLATE` | No | JWT template name (default: `convex`) |

See `.env.local.example` for the full list with comments.

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run env:check    # Validate environment variables
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/                  # API routes (accounting, audit-trail)
    dashboard/            # Authenticated dashboard pages
    sign-in/              # Clerk sign-in page
    sign-up/              # Clerk sign-up page
  components/
    accounting/           # Accounting UI components
    shell/                # App shell, tenant shell
    ui/                   # Shared UI components
  lib/
    auth/                 # Tenant context, roles
    data/                 # Server data loaders (Convex + demo fallback)
    demo/                 # Demo data for offline/fallback mode
convex/
  schema.ts               # Database schema
  auditTrail.ts           # Audit trail CRUD
  users.ts                # User management (Clerk-synced)
  auth.config.ts          # Clerk JWT issuer config
  lib/withAuth.ts         # Auth helpers for Convex functions
docs/                     # Roadmap, implementation plans, backlog
```

## Deployment

### Vercel (recommended)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy — CI will lint/typecheck/build on every push to main

### Convex Deployment

```bash
npx convex deploy
```

Set `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard to match your Clerk instance.

### Clerk Setup

1. Create a Clerk application
2. Create a JWT template named `convex` with `aud: convex` claim
3. Set the template's issuer domain in Convex `auth.config.ts`

## Key Docs

- `docs/2026-04-04-green-phased-execution-roadmap.md` — Build roadmap and completion status
- `docs/2026-04-04-github-backlog.md` — Issue backlog (P0-P2)
- `docs/2026-04-04-green-schema-and-route-map.md` — Schema and route reference
- `docs/2026-04-04-external-demo-checklist.md` — Demo readiness checklist
